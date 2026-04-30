<script setup>
import { ref, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { api} from "@/api";

const fullName = ref('')
const email = ref('')
const consentGiven = ref(false)

const student = ref(null)
const qrToken = ref(null)
const qrDataUrl = ref(null)
const secondsLeft = ref(0)

const loading = ref(false)
const errorMessage = ref(null)

const REFRESH_SECONDS = 15
let refreshInterval = null
let countdownInterval = null

async function register() {
  errorMessage.value = null
  loading.value = true
  try {
    student.value = await api.createStudent({
      fullName: fullName.value,
      email: email.value,
      consentGiven: consentGiven.value
    })
    await refreshQrToken()
    startAutoRefresh()

  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

async function refreshQrToken() {
  const tokenResponse = await api.getStudentQrToken(student.value.id)
  qrToken.value = tokenResponse.token
  qrDataUrl.value = await QRCode.toDataURL(qrToken.value, { width: 256 })
  secondsLeft.value = REFRESH_SECONDS
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval = setInterval(refreshQrToken, REFRESH_SECONDS * 1000)
  countdownInterval = setInterval(() => {
    if (secondsLeft.value > 0) secondsLeft.value--
  }, 1000)
}

function stopAutoRefresh() {
  if (refreshInterval) clearInterval(refreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)
  refreshInterval = null
  countdownInterval = null
}

function reset() {
  stopAutoRefresh()
  fullName.value = ''
  email.value = ''
  student.value = null
  qrToken.value = null
  qrDataUrl.value = null
  secondsLeft.value = 0
  errorMessage.value = null
}

onUnmounted(stopAutoRefresh)

</script>

<template>
  <h2>Student registratie</h2>

  <form v-if="!student" @submit.prevent="register">
    <label>
      Volledige naam
      <input v-model="fullName" required />
    </label>
    <label>
      Email
      <input v-model="email" type="email" required />
    </label>
        <label class="consent-label">
      <input type="checkbox" v-model="consentGiven" />
      Ik ga akkoord met de verwerking van mijn persoonsgegevens voor dit event
    </label>
    <button type="submit" :disabled="loading || !consentGiven">
      {{ loading ? 'Bezig…' : 'Registreer' }}
    </button>
  </form>

  <div v-else class="qr-result">
    <p>Geregistreerd als <strong>{{ student.fullName }}</strong> (id {{ student.id }})</p>
    <p>Toon deze QR-code aan een bedrijf:</p>
    <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code" />
    <p class="countdown">
      Vernieuwt over <strong>{{ secondsLeft }}</strong> seconde(n)
    </p>
    <p class="token">Token: <code>{{ qrToken }}</code></p>
    <button @click="reset">Reset</button>
  </div>

  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>

<style scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 320px;
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
.qr-result {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}
.countdown {
  font-size: 0.95rem;
  color: #444;
}
.token {
  font-size: 0.85rem;
  color: #555;
  word-break: break-all;
  max-width: 320px;
}
.error {
  color: crimson;
  margin-top: 1rem;
}
.consent-label {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

</style>