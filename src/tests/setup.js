import { randomFillSync } from 'crypto'
import { clearMocks } from '@tauri-apps/api/mocks'
import { afterEach, beforeAll } from 'vitest'

beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: {
      getRandomValues: (buffer) => randomFillSync(buffer),
    },
  })
})

afterEach(() => {
  clearMocks()
})
