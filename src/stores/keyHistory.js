import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useKeyHistoryStore = defineStore('keyHistory', () => {
  const keys = ref([])

  function addKey(name, lengthBytes) {
    if (!name || keys.value.some(k => k.name === name)) return
    keys.value.unshift({ name, lengthBytes, bits: lengthBytes * 8 })
  }

  return { keys, addKey }
})
