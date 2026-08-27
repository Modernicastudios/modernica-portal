// AES-256-GCM encryption for sensitive fields (phone numbers, personal notes, etc.).
// Set ENCRYPTION_KEY (32+ char random string) in env. Falls back to a derived key in dev.
// Encrypted format: base64(iv[12] + tag[16] + ciphertext)

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGO = 'aes-256-gcm'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? ''
  if (raw.length >= 32) return Buffer.from(raw.slice(0, 32))
  // Dev fallback: derive from service role key tail — never use in production
  const fallback = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').slice(-32).padEnd(32, '0')
  return Buffer.from(fallback)
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64')
  const iv  = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = createDecipheriv(ALGO, getKey(), iv)
  decipher.setAuthTag(tag)
  return decipher.update(enc).toString('utf8') + decipher.final('utf8')
}

export function safeEncrypt(value: string | null | undefined): string | null {
  if (!value) return null
  try { return encrypt(value) } catch { return null }
}

export function safeDecrypt(value: string | null | undefined): string | null {
  if (!value) return null
  try { return decrypt(value) } catch { return value ?? null }
}
