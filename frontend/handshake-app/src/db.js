const DB_NAME = 'handshake-poc'
const DB_VERSION = 1
const STORE = 'scan-queue'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function tx(db, mode) {
  return db.transaction(STORE, mode).objectStore(STORE)
}

export async function addScan(scan) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, 'readwrite').add(scan)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getQueuedScans() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, 'readonly').getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function removeScan(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, 'readwrite').delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function countQueued() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = tx(db, 'readonly').count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
