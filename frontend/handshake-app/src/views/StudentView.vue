<script setup>
import { ref } from 'vue'
import QRCode from 'qrcode'
import { api} from "@/api";

const fullName = ref('')
const email = ref('')

const student = ref(null)
const qrToken = ref(null)
const qrDataUrl = ref(null)

const loading = ref(false)
const errorMessage = ref(null)

async function register() {
  errorMessage.value = null
  loading.value = true
  try {
    student.value = await api.createStudent({
      fullName: fullName.value,
      email: email.value
    })

    const tokenResponse = await api.getStudentQrToken(student.value.id)
    qrToken.value = tokenResponse.token

    qrDataUrl.value = await QRCode.toDataURL(qrToken.value, { width: 256 })
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

function reset() {
  fullName.value = ''
  email.value = ''
  student.value = null
  qrToken.value = null
  qrDataUrl.value = null
  errorMessage.value = null
}

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
    <button type="submit" :disabled="loading">
      {{ loading ? 'Bezig…' : 'Registreer' }}
    </button>
  </form>

  <div v-else class="qr-result">
    <p>Geregistreerd als <strong>{{ student.fullName }}</strong> (id {{ student.id }})</p>
    <p>Toon deze QR-code aan een bedrijf:</p>
    <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR code" />
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
.token {
  font-size: 0.85rem;
  color: #555;
}
.error {
  color: crimson;
  margin-top: 1rem;
}
</style>