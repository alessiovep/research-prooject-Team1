const KEY_DB_NAME = 'handshake-keys'
const KEY_STORE = 'crypto-keys'
const KEY_ID = 'queue-encryption-key'

function openKeyDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(KEY_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function loadKey() {
  const db = await openKeyDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readonly').objectStore(KEY_STORE)
    const request = tx.get(KEY_ID)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

async function storeKey(key) {
  const db = await openKeyDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite').objectStore(KEY_STORE)
    const request = tx.put(key, KEY_ID)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

let cachedKey = null

async function getKey() {
  if (cachedKey) return cachedKey

  let key = await loadKey()
  if (!key) {
    key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false, // non-extractable
      ['encrypt', 'decrypt']
    )
    await storeKey(key)
  }

  cachedKey = key
  return key
}

export async function encrypt(plaintext) {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  )
  return { iv, ciphertext: new Uint8Array(ciphertext) }
}

export async function decrypt({ iv, ciphertext }) {
  const key = await getKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decrypted)
}
