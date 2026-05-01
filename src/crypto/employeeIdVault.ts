const textEnc = new TextEncoder()
const textDec = new TextDecoder()

export function normalizeEmployeeId(id: string): string {
  return id.replace(/\D/g, '').slice(0, 8)
}

function requireSecret(): string {
  const s = import.meta.env.VITE_EMPLOYEE_ID_SECRET
  if (typeof s !== 'string' || s.length < 16) {
    throw new Error(
      'VITE_EMPLOYEE_ID_SECRET is missing or shorter than 16 characters'
    )
  }
  return s
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function bufferToB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function uint8ToB64(bytes: Uint8Array): string {
  return bufferToB64(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  )
}

function b64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }
  return out.buffer
}

async function importAesKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    textEnc.encode(`aes:${requireSecret()}`)
  )
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function importHmacKey(): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    textEnc.encode(`hmac:${requireSecret()}`)
  )
  return crypto.subtle.importKey(
    'raw',
    digest,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
}

export async function getEmployeeSearchKey(normalizedId: string): Promise<string> {
  const key = await importHmacKey()
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    textEnc.encode(normalizedId)
  )
  return bufferToHex(sig)
}

export type SealedEmployeePayload = {
  employeeKey: string
  employeeIv: string
  employeeCipher: string
}

export async function sealEmployeeId(
  normalizedId: string
): Promise<SealedEmployeePayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await importAesKey()
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    textEnc.encode(normalizedId)
  )
  return {
    employeeKey: await getEmployeeSearchKey(normalizedId),
    employeeIv: uint8ToB64(iv),
    employeeCipher: bufferToB64(cipher),
  }
}

export type SealedEmployeeFields = {
  employeeKey?: string
  employeeIv?: string
  employeeCipher?: string
  /** Legacy documents only */
  employeeId?: string
}

export async function revealEmployeeId(
  sealed: SealedEmployeeFields
): Promise<string> {
  if (sealed.employeeCipher && sealed.employeeIv) {
    const aesKey = await importAesKey()
    const iv = new Uint8Array(b64ToBuffer(sealed.employeeIv))
    const cipher = b64ToBuffer(sealed.employeeCipher)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipher
    )
    return textDec.decode(plain)
  }
  if (sealed.employeeId) {
    return sealed.employeeId
  }
  return '—'
}
