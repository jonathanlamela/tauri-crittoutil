import { invoke } from '@tauri-apps/api/core'

export async function hashMd5(plaintext) {
  return invoke('hash_md5', { plaintext })
}

export async function encryptAesCbc(plaintext, key) {
  return invoke('encrypt_aes_cbc', { plaintext, key })
}

export async function decryptAesCbc(payload, key) {
  return invoke('decrypt_aes_cbc', { payload, key })
}

export async function encryptAesEcb(plaintext, key) {
  return invoke('encrypt_aes_ecb', { plaintext, key })
}

export async function decryptAesEcb(payload, key) {
  return invoke('decrypt_aes_ecb', { payload, key })
}

export async function encryptDesEcb(plaintext, key) {
  return invoke('encrypt_des_ecb', { plaintext, key })
}

export async function decryptDesEcb(payload, key) {
  return invoke('decrypt_des_ecb', { payload, key })
}

export async function encryptDesCbc(plaintext, key) {
  return invoke('encrypt_des_cbc', { plaintext, key })
}

export async function decryptDesCbc(payload, key) {
  return invoke('decrypt_des_cbc', { payload, key })
}

export async function generateKey(bits) {
  return invoke('generate_key', { bits })
}

export const encryptAlgorithms = [
  { id: 'md5', name: 'MD5', requireIv: false, requireKey: false },
  { id: 'aes_cbc', name: 'AES (CBC)', requireIv: true, requireKey: true, keyLengths: [16, 24, 32] },
  { id: 'aes_ecb', name: 'AES (ECB)', requireIv: false, requireKey: true, keyLengths: [16, 24, 32] },
  { id: 'des_ecb', name: 'DES (ECB)', requireIv: false, requireKey: true, keyLengths: [8] },
  { id: 'des_cbc', name: 'DES (CBC)', requireIv: true, requireKey: true, keyLengths: [8] },
]

export const decryptAlgorithms = [
  { id: 'aes_cbc', name: 'AES (CBC)', requireIv: true, requireKey: true, keyLengths: [16, 24, 32] },
  { id: 'aes_ecb', name: 'AES (ECB)', requireIv: false, requireKey: true, keyLengths: [16, 24, 32] },
  { id: 'des_ecb', name: 'DES (ECB)', requireIv: false, requireKey: true, keyLengths: [8] },
  { id: 'des_cbc', name: 'DES (CBC)', requireIv: true, requireKey: true, keyLengths: [8] },
]

export async function encrypt(alg, plaintext, key) {
  switch (alg.id) {
    case 'md5': return hashMd5(plaintext)
    case 'aes_cbc': return encryptAesCbc(plaintext, key)
    case 'aes_ecb': return encryptAesEcb(plaintext, key)
    case 'des_ecb': return encryptDesEcb(plaintext, key)
    case 'des_cbc': return encryptDesCbc(plaintext, key)
    default: throw new Error('Unknown algorithm')
  }
}

export async function decrypt(alg, payload, key) {
  switch (alg.id) {
    case 'aes_cbc': return decryptAesCbc(payload, key)
    case 'aes_ecb': return decryptAesEcb(payload, key)
    case 'des_ecb': return decryptDesEcb(payload, key)
    case 'des_cbc': return decryptDesCbc(payload, key)
    default: throw new Error('Unknown algorithm')
  }
}

export function validateKey(alg, key) {
  if (!alg.requireKey) return null
  if (!key) return 'Please enter a key'
  const len = new TextEncoder().encode(key).length
  if (alg.keyLengths) {
    if (!alg.keyLengths.includes(len)) {
      if (alg.keyLengths.includes(8)) {
        return 'Key must be exactly 8 bytes for DES'
      }
      return 'Key must be 16, 24, or 32 bytes for AES'
    }
  }
  return null
}
