<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { api } from '@/api'
import { addScan, getQueuedScans, removeScan, countQueued } from '@/db'

const companyName = ref('')
const company = ref(null)

const tokenInput = ref('')
const lastScan = ref(null)
const errorMessage = ref(null)
const submitting = ref(false)
const queueCount = ref(0)
const syncing = ref(false)

async function setupCompany() {
  errorMessage.value = null
  try {
    company.value = await api.createCompany({ name: companyName.value })
  } catch (err) {
    errorMessage.value = err.message
  }
}

async function submitScan() {
  errorMessage.value = null
  submitting.value = true

  const token = tokenInput.value.trim()
  const companyId = company.value.id

  try {
    const scan = await api.createScan({ companyId, token })
    lastScan.value = { token, scan, at: new Date().toISOString(), offline: false }
    tokenInput.value = ''
  } catch (err) {
    if (isNetworkError(err)) {
      const scannedAt = new Date().toISOString()
      await addScan({ companyId, token, scannedAt })
      queueCount.value = await countQueued()
      lastScan.value = { token, scan: null, at: scannedAt, offline: true }
      tokenInput.value = ''
    } else {
      errorMessage.value = err.message
    }
  } finally {
    submitting.value = false
  }
}

function isNetworkError(err) {
  return !(err && typeof err.message === 'string' && err.message.startsWith('API '))
}


async function syncQueue() {
  const queued = await getQueuedScans()
  if (queued.length === 0) return

  syncing.value = true
  let successCount = 0

  let rejectedCount = 0

for (const item of queued) {
  try {
    await api.createScan({
      companyId: item.companyId,
      token: item.token,
      scannedAt: item.scannedAt
    })
    await removeScan(item.id)
    successCount++
  } catch (err) {
    if (isNetworkError(err)) {
      // Server onbereikbaar, stop sync, items blijven in queue voor later
      break
    }
    // Server bereikt maar weigert de scan
    // Verwijder uit queue zodat het geen volgende sync blokkeert.
    await removeScan(item.id)
    rejectedCount++
  }
}


  queueCount.value = await countQueued()
  syncing.value = false

  if (successCount > 0 || rejectedCount > 0) {
  errorMessage.value = null
  let msg = ''
  if (successCount > 0) msg += `${successCount} offline scan(s) gesynchroniseerd`
  if (rejectedCount > 0) msg += (msg ? ' · ' : '') + `${rejectedCount} geweigerd door server`
  lastScan.value = {
    token: null,
    scan: null,
    at: new Date().toISOString(),
    offline: false,
    syncMessage: msg
  }
}
}


async function onOnline() {
  await syncQueue()
}

onMounted(async () => {
  queueCount.value = await countQueued()
  window.addEventListener('online', onOnline)
})

onUnmounted(() => {
  window.removeEventListener('online', onOnline)
})
</script>

<template>
  <h2>Scanner (Bedrijf)</h2>

  <form v-if="!company" @submit.prevent="setupCompany">
    <label>
      Bedrijfsnaam
      <input v-model="companyName" required />
    </label>
    <button type="submit">Start scannen</button>
  </form>

  <div v-else class="scanner">
    <p>Ingelogd als <strong>{{ company.name }}</strong> (id {{ company.id }}).</p>

    <div v-if="queueCount > 0" class="queue-banner">
      {{ queueCount }} scan(s) in wachtrij — wachten op netwerk
      <button @click="syncQueue" :disabled="syncing">
        {{ syncing ? 'Bezig…' : 'Nu synchroniseren' }}
      </button>
    </div>

    <form @submit.prevent="submitScan">
      <label>
        Plak hier de token (bv. <code>student:1:guid</code>)
        <input v-model="tokenInput" required />
      </label>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Bezig…' : 'Registreer scan' }}
      </button>
    </form>

    <div v-if="lastScan" :class="lastScan.offline ? 'last-scan offline' : 'last-scan'">
      <div v-if="lastScan.syncMessage">
        <strong>{{ lastScan.syncMessage }}</strong>
      </div>
      <div v-else>
        <h3>Laatste scan ({{ new Date(lastScan.at).toLocaleTimeString() }})</h3>
        <p v-if="lastScan.offline">
          ⚠️ Offline opgeslagen — wordt gesynchroniseerd bij netwerkherstel
        </p>
        <p v-else>Token: <code>{{ lastScan.token }}</code></p>
        <p v-if="lastScan.scan">
          Scan ID: {{ lastScan.scan.id }} → student {{ lastScan.scan.studentId }}
        </p>
      </div>
    </div>
  </div>

  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
input {
  padding: 0.5rem;
  font-size: 1rem;
}
button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  cursor: pointer;
}
.scanner {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.queue-banner {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #fff8e1;
  border: 1px solid #f0c040;
  border-radius: 4px;
}
.last-scan {
  padding: 0.75rem;
  background: #f0fff0;
  border: 1px solid #8c8;
  border-radius: 4px;
}
.last-scan.offline {
  background: #fff8e1;
  border-color: #f0c040;
}
.error {
  color: crimson;
  margin-top: 1rem;
}
</style>
