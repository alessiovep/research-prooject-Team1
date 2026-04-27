<script setup>
import { ref } from 'vue'
import { api } from '@/api'

const companyName = ref('')
const company = ref(null)

const tokenInput = ref('')
const lastScan = ref(null)
const errorMessage = ref(null)
const submitting = ref(false)

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
  try {
    const scan = await api.createScan({
      companyId: company.value.id,
      token: tokenInput.value.trim()
    })
    lastScan.value = {
      token: tokenInput.value.trim(),
      scan,
      at: new Date().toLocaleTimeString()
    }
    tokenInput.value = ''
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    submitting.value = false
  }
}
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

    <form @submit.prevent="submitScan">
      <label>
        Plak hier de token (bv. <code>student:1</code>)
        <input v-model="tokenInput" required />
      </label>
      <button type="submit" :disabled="submitting">
        {{ submitting ? 'Bezig…' : 'Registreer scan' }}
      </button>
    </form>

    <div v-if="lastScan" class="last-scan">
      <h3>Laatste scan ({{ lastScan.at }})</h3>
      <p>Token: <code>{{ lastScan.token }}</code></p>
      <p>Scan ID: {{ lastScan.scan.id }} → student {{ lastScan.scan.studentId }}</p>
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
.last-scan {
  padding: 0.75rem;
  background: #f0fff0;
  border: 1px solid #8c8;
  border-radius: 4px;
}
.error {
  color: crimson;
  margin-top: 1rem;
}
</style>
