const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`API ${response.status}: ${text}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  createStudent: (data) =>
    request('/api/students', { method: 'POST', body: JSON.stringify(data) }),

  getStudentQrToken: (id) =>
    request(`/api/students/${id}/qr-token`),

  createCompany: (data) =>
    request('/api/companies', { method: 'POST', body: JSON.stringify(data) }),

  createScan: (data) =>
    request('/api/scans', { method: 'POST', body: JSON.stringify(data) })
}