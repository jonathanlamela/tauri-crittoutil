import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mockIPC } from '@tauri-apps/api/mocks'
import { useEncrypterStore } from '../stores/encrypter.js'
import { useDecrypterStore } from '../stores/decrypter.js'
import { useKeyGeneratorStore } from '../stores/keyGenerator.js'
import { useConverterStore } from '../stores/converter.js'
import { useKeyHistoryStore } from '../stores/keyHistory.js'

beforeEach(() => {
  setActivePinia(createPinia())
})

// ─── EncrypterStore ───────────────────────────────────────────────────────────

describe('useEncrypterStore', () => {
  it('has correct initial state', () => {
    const store = useEncrypterStore()
    expect(store.selectedAlgId).toBe('md5')
    expect(store.plaintext).toBe('')
    expect(store.key).toBe('')
    expect(store.iv).toBe('')
    expect(store.resultCipher).toBe('')
    expect(store.resultIv).toBe('')
    expect(store.errorMsg).toBe('')
  })

  it('clear() resets all fields', () => {
    const store = useEncrypterStore()
    store.plaintext = 'secret'
    store.key = 'mykey'
    store.iv = 'myiv'
    store.resultCipher = 'abc123'
    store.resultIv = 'iv123'
    store.errorMsg = 'oops'
    store.clear()
    expect(store.plaintext).toBe('')
    expect(store.key).toBe('')
    expect(store.iv).toBe('')
    expect(store.resultCipher).toBe('')
    expect(store.resultIv).toBe('')
    expect(store.errorMsg).toBe('')
  })
})

// ─── DecrypterStore ───────────────────────────────────────────────────────────

describe('useDecrypterStore', () => {
  it('has correct initial state', () => {
    const store = useDecrypterStore()
    expect(store.selectedAlgId).toBe('aes_cbc')
    expect(store.payload).toBe('')
    expect(store.key).toBe('')
    expect(store.iv).toBe('')
    expect(store.result).toBe('')
    expect(store.errorMsg).toBe('')
  })

  it('clear() resets all fields', () => {
    const store = useDecrypterStore()
    store.payload = 'cipher'
    store.key = 'k'
    store.iv = 'v'
    store.result = 'plain'
    store.errorMsg = 'err'
    store.clear()
    expect(store.payload).toBe('')
    expect(store.key).toBe('')
    expect(store.iv).toBe('')
    expect(store.result).toBe('')
    expect(store.errorMsg).toBe('')
  })
})

// ─── KeyGeneratorStore ────────────────────────────────────────────────────────

describe('useKeyGeneratorStore', () => {
  it('has correct initial state', () => {
    const store = useKeyGeneratorStore()
    expect(store.keySize).toBe(128)
    expect(store.generatedKey).toBe('')
  })

  it('clear() resets to defaults', () => {
    const store = useKeyGeneratorStore()
    store.keySize = 256
    store.generatedKey = 'somekey'
    store.clear()
    expect(store.keySize).toBe(128)
    expect(store.generatedKey).toBe('')
  })
})

// ─── ConverterStore ───────────────────────────────────────────────────────────

describe('useConverterStore', () => {
  it('has correct initial state', () => {
    const store = useConverterStore()
    expect(store.input).toBe('')
    expect(store.inputType).toBe('text')
    expect(store.outputType).toBe('binary')
    expect(store.output).toBe('')
    expect(store.inputError).toBe('')
  })

  it('clear() resets all fields including types', () => {
    const store = useConverterStore()
    store.input = 'hello'
    store.inputType = 'base64'
    store.outputType = 'hex'
    store.output = '68656c6c6f'
    store.inputError = 'bad input'
    store.clear()
    expect(store.input).toBe('')
    expect(store.inputType).toBe('text')
    expect(store.outputType).toBe('binary')
    expect(store.output).toBe('')
    expect(store.inputError).toBe('')
  })
})

// ─── KeyHistoryStore ──────────────────────────────────────────────────────────

describe('useKeyHistoryStore', () => {
  it('starts with empty key list', () => {
    const store = useKeyHistoryStore()
    expect(store.keys).toHaveLength(0)
  })

  it('addKey() adds a key to the front of the list', () => {
    const store = useKeyHistoryStore()
    store.addKey('mykey', 16)
    expect(store.keys).toHaveLength(1)
    expect(store.keys[0]).toMatchObject({ name: 'mykey', lengthBytes: 16, bits: 128 })
  })

  it('addKey() prepends — newest key is at index 0', () => {
    const store = useKeyHistoryStore()
    store.addKey('first', 16)
    store.addKey('second', 32)
    expect(store.keys[0].name).toBe('second')
    expect(store.keys[1].name).toBe('first')
  })

  it('addKey() ignores empty name', () => {
    const store = useKeyHistoryStore()
    store.addKey('', 16)
    expect(store.keys).toHaveLength(0)
  })

  it('addKey() ignores duplicate name', () => {
    const store = useKeyHistoryStore()
    store.addKey('mykey', 16)
    store.addKey('mykey', 32)
    expect(store.keys).toHaveLength(1)
  })

  it('computes bits from lengthBytes correctly', () => {
    const store = useKeyHistoryStore()
    store.addKey('k8', 8)
    store.addKey('k24', 24)
    expect(store.keys.find(k => k.name === 'k8').bits).toBe(64)
    expect(store.keys.find(k => k.name === 'k24').bits).toBe(192)
  })
})

// ─── IPC integration: generateKey → KeyGeneratorStore ────────────────────────

describe('generateKey IPC integration', () => {
  it('resolves the mocked key from Tauri backend', async () => {
    mockIPC((cmd) => {
      if (cmd === 'generate_key') return 'generatedkey1234'
    })
    const { generateKey } = await import('../composables/useCrypto.js')
    const result = await generateKey(128)
    expect(result).toBe('generatedkey1234')
  })
})
