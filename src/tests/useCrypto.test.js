import { describe, it, expect, vi } from 'vitest'
import { mockIPC } from '@tauri-apps/api/mocks'
import {
  hashMd5,
  hashMd5Bytes,
  encryptAesCbc,
  decryptAesCbc,
  encryptAesEcb,
  decryptAesEcb,
  encryptDesEcb,
  decryptDesEcb,
  encryptDesCbc,
  decryptDesCbc,
  generateKey,
  encrypt,
  decrypt,
  validateKey,
  encryptAlgorithms,
  decryptAlgorithms,
} from '../composables/useCrypto.js'

// ─── mockIPC helpers ──────────────────────────────────────────────────────────

const FAKE_MD5  = 'aabbccddeeff00112233445566778899'
const FAKE_CIPHER = 'dGVzdGNpcGhlcg=='
const FAKE_PLAIN  = 'hello'
const FAKE_KEY_16 = 'aaaaaaaaaaaaaaaa'
const FAKE_KEY_8  = 'aaaaaaaa'
const FAKE_IV_16  = 'bbbbbbbbbbbbbbbb'
const FAKE_IV_8   = 'bbbbbbbb'
const FAKE_GEN_KEY = 'cccccccccccccccc'

// ─── hashMd5 ─────────────────────────────────────────────────────────────────

describe('hashMd5', () => {
  it('invokes hash_md5 and returns the digest', async () => {
    mockIPC((cmd, args) => {
      if (cmd === 'hash_md5') return FAKE_MD5
    })
    await expect(hashMd5('hello')).resolves.toBe(FAKE_MD5)
  })

  it('passes plaintext to the command', async () => {
    mockIPC((cmd) => { if (cmd === 'hash_md5') return FAKE_MD5 })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    await hashMd5('world')
    expect(spy).toHaveBeenCalledWith('hash_md5', { plaintext: 'world' }, undefined)
  })
})

// ─── hashMd5Bytes ─────────────────────────────────────────────────────────────

describe('hashMd5Bytes', () => {
  it('invokes hash_md5_bytes and returns the digest', async () => {
    mockIPC((cmd) => { if (cmd === 'hash_md5_bytes') return FAKE_MD5 })
    const bytes = new Uint8Array([104, 101, 108, 108, 111]) // "hello"
    await expect(hashMd5Bytes(bytes)).resolves.toBe(FAKE_MD5)
  })

  it('converts the input to a plain array before sending', async () => {
    mockIPC((cmd) => { if (cmd === 'hash_md5_bytes') return FAKE_MD5 })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    const bytes = new Uint8Array([1, 2, 3])
    await hashMd5Bytes(bytes)
    expect(spy).toHaveBeenCalledWith('hash_md5_bytes', { data: [1, 2, 3] }, undefined)
  })

  it('handles an empty byte array', async () => {
    mockIPC((cmd) => { if (cmd === 'hash_md5_bytes') return FAKE_MD5 })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    await hashMd5Bytes(new Uint8Array([]))
    expect(spy).toHaveBeenCalledWith('hash_md5_bytes', { data: [] }, undefined)
  })
})

// ─── AES-CBC ─────────────────────────────────────────────────────────────────

describe('encryptAesCbc', () => {
  it('invokes encrypt_aes_cbc and returns ciphertext', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_cbc') return FAKE_CIPHER })
    await expect(encryptAesCbc(FAKE_PLAIN, FAKE_KEY_16, FAKE_IV_16)).resolves.toBe(FAKE_CIPHER)
  })

  it('passes correct args including iv', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_cbc') return FAKE_CIPHER })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    await encryptAesCbc(FAKE_PLAIN, FAKE_KEY_16, FAKE_IV_16)
    expect(spy).toHaveBeenCalledWith(
      'encrypt_aes_cbc',
      { plaintext: FAKE_PLAIN, key: FAKE_KEY_16, iv: FAKE_IV_16 },
      undefined,
    )
  })

  it('sends null iv when not provided', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_cbc') return FAKE_CIPHER })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    await encryptAesCbc(FAKE_PLAIN, FAKE_KEY_16)
    expect(spy).toHaveBeenCalledWith(
      'encrypt_aes_cbc',
      { plaintext: FAKE_PLAIN, key: FAKE_KEY_16, iv: null },
      undefined,
    )
  })
})

describe('decryptAesCbc', () => {
  it('invokes decrypt_aes_cbc and returns plaintext', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_aes_cbc') return FAKE_PLAIN })
    await expect(decryptAesCbc(FAKE_CIPHER, FAKE_KEY_16, FAKE_IV_16)).resolves.toBe(FAKE_PLAIN)
  })
})

// ─── AES-ECB ─────────────────────────────────────────────────────────────────

describe('encryptAesEcb', () => {
  it('invokes encrypt_aes_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_ecb') return FAKE_CIPHER })
    await expect(encryptAesEcb(FAKE_PLAIN, FAKE_KEY_16)).resolves.toBe(FAKE_CIPHER)
  })
})

describe('decryptAesEcb', () => {
  it('invokes decrypt_aes_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_aes_ecb') return FAKE_PLAIN })
    await expect(decryptAesEcb(FAKE_CIPHER, FAKE_KEY_16)).resolves.toBe(FAKE_PLAIN)
  })
})

// ─── DES-ECB ─────────────────────────────────────────────────────────────────

describe('encryptDesEcb', () => {
  it('invokes encrypt_des_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_des_ecb') return FAKE_CIPHER })
    await expect(encryptDesEcb(FAKE_PLAIN, FAKE_KEY_8)).resolves.toBe(FAKE_CIPHER)
  })
})

describe('decryptDesEcb', () => {
  it('invokes decrypt_des_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_des_ecb') return FAKE_PLAIN })
    await expect(decryptDesEcb(FAKE_CIPHER, FAKE_KEY_8)).resolves.toBe(FAKE_PLAIN)
  })
})

// ─── DES-CBC ─────────────────────────────────────────────────────────────────

describe('encryptDesCbc', () => {
  it('invokes encrypt_des_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_des_cbc') return FAKE_CIPHER })
    await expect(encryptDesCbc(FAKE_PLAIN, FAKE_KEY_8, FAKE_IV_8)).resolves.toBe(FAKE_CIPHER)
  })
})

describe('decryptDesCbc', () => {
  it('invokes decrypt_des_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_des_cbc') return FAKE_PLAIN })
    await expect(decryptDesCbc(FAKE_CIPHER, FAKE_KEY_8, FAKE_IV_8)).resolves.toBe(FAKE_PLAIN)
  })
})

// ─── generateKey ─────────────────────────────────────────────────────────────

describe('generateKey', () => {
  it('invokes generate_key with the requested bit size', async () => {
    mockIPC((cmd) => { if (cmd === 'generate_key') return FAKE_GEN_KEY })
    const spy = vi.spyOn(window.__TAURI_INTERNALS__, 'invoke')
    await generateKey(128)
    expect(spy).toHaveBeenCalledWith('generate_key', { bits: 128 }, undefined)
  })

  it('returns the generated key', async () => {
    mockIPC((cmd) => { if (cmd === 'generate_key') return FAKE_GEN_KEY })
    await expect(generateKey(256)).resolves.toBe(FAKE_GEN_KEY)
  })
})

// ─── encrypt dispatcher ───────────────────────────────────────────────────────

describe('encrypt', () => {
  it('dispatches md5 to hash_md5', async () => {
    mockIPC((cmd) => { if (cmd === 'hash_md5') return FAKE_MD5 })
    const alg = encryptAlgorithms.find(a => a.id === 'md5')
    await expect(encrypt(alg, FAKE_PLAIN, null, null)).resolves.toBe(FAKE_MD5)
  })

  it('dispatches aes_cbc to encrypt_aes_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_cbc') return FAKE_CIPHER })
    const alg = encryptAlgorithms.find(a => a.id === 'aes_cbc')
    await expect(encrypt(alg, FAKE_PLAIN, FAKE_KEY_16, FAKE_IV_16)).resolves.toBe(FAKE_CIPHER)
  })

  it('dispatches aes_ecb to encrypt_aes_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_aes_ecb') return FAKE_CIPHER })
    const alg = encryptAlgorithms.find(a => a.id === 'aes_ecb')
    await expect(encrypt(alg, FAKE_PLAIN, FAKE_KEY_16)).resolves.toBe(FAKE_CIPHER)
  })

  it('dispatches des_ecb to encrypt_des_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_des_ecb') return FAKE_CIPHER })
    const alg = encryptAlgorithms.find(a => a.id === 'des_ecb')
    await expect(encrypt(alg, FAKE_PLAIN, FAKE_KEY_8)).resolves.toBe(FAKE_CIPHER)
  })

  it('dispatches des_cbc to encrypt_des_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'encrypt_des_cbc') return FAKE_CIPHER })
    const alg = encryptAlgorithms.find(a => a.id === 'des_cbc')
    await expect(encrypt(alg, FAKE_PLAIN, FAKE_KEY_8, FAKE_IV_8)).resolves.toBe(FAKE_CIPHER)
  })

  it('throws on unknown algorithm', async () => {
    await expect(encrypt({ id: 'unknown' }, FAKE_PLAIN, '')).rejects.toThrow('Unknown algorithm')
  })
})

// ─── decrypt dispatcher ───────────────────────────────────────────────────────

describe('decrypt', () => {
  it('dispatches aes_cbc to decrypt_aes_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_aes_cbc') return FAKE_PLAIN })
    const alg = decryptAlgorithms.find(a => a.id === 'aes_cbc')
    await expect(decrypt(alg, FAKE_CIPHER, FAKE_KEY_16, FAKE_IV_16)).resolves.toBe(FAKE_PLAIN)
  })

  it('dispatches aes_ecb to decrypt_aes_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_aes_ecb') return FAKE_PLAIN })
    const alg = decryptAlgorithms.find(a => a.id === 'aes_ecb')
    await expect(decrypt(alg, FAKE_CIPHER, FAKE_KEY_16)).resolves.toBe(FAKE_PLAIN)
  })

  it('dispatches des_ecb to decrypt_des_ecb', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_des_ecb') return FAKE_PLAIN })
    const alg = decryptAlgorithms.find(a => a.id === 'des_ecb')
    await expect(decrypt(alg, FAKE_CIPHER, FAKE_KEY_8)).resolves.toBe(FAKE_PLAIN)
  })

  it('dispatches des_cbc to decrypt_des_cbc', async () => {
    mockIPC((cmd) => { if (cmd === 'decrypt_des_cbc') return FAKE_PLAIN })
    const alg = decryptAlgorithms.find(a => a.id === 'des_cbc')
    await expect(decrypt(alg, FAKE_CIPHER, FAKE_KEY_8, FAKE_IV_8)).resolves.toBe(FAKE_PLAIN)
  })

  it('throws on unknown algorithm', async () => {
    await expect(decrypt({ id: 'unknown' }, FAKE_CIPHER, '')).rejects.toThrow('Unknown algorithm')
  })
})

// ─── validateKey ─────────────────────────────────────────────────────────────

describe('validateKey', () => {
  const md5Alg  = encryptAlgorithms.find(a => a.id === 'md5')
  const aesAlg  = encryptAlgorithms.find(a => a.id === 'aes_ecb')
  const desAlg  = encryptAlgorithms.find(a => a.id === 'des_ecb')

  it('returns null for md5 (no key required)', () => {
    expect(validateKey(md5Alg, '')).toBeNull()
  })

  it('returns error when AES key is empty', () => {
    expect(validateKey(aesAlg, '')).toBeTruthy()
  })

  it('returns null for valid 16-byte AES key', () => {
    expect(validateKey(aesAlg, FAKE_KEY_16)).toBeNull()
  })

  it('returns null for valid 24-byte AES key', () => {
    expect(validateKey(aesAlg, 'aaaaaaaaaaaaaaaaaaaaaaaa')).toBeNull()
  })

  it('returns null for valid 32-byte AES key', () => {
    expect(validateKey(aesAlg, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBeNull()
  })

  it('returns AES error for wrong key length', () => {
    const err = validateKey(aesAlg, 'short')
    expect(err).toMatch(/16, 24, or 32/)
  })

  it('returns null for valid 8-byte DES key', () => {
    expect(validateKey(desAlg, FAKE_KEY_8)).toBeNull()
  })

  it('returns DES error for wrong key length', () => {
    const err = validateKey(desAlg, 'tooshort')
    // 'tooshort' is exactly 8 bytes — use a 7-char string instead
    const err2 = validateKey(desAlg, 'toolong_')
    expect(validateKey(desAlg, 'short')).toMatch(/8 bytes/)
  })
})
