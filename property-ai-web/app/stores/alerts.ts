import { defineStore } from 'pinia'

export type AlertColor = 'error' | 'success' | 'warning' | 'info'

export interface Alert {
  id: number
  color: AlertColor
  title: string
  description?: string
}

const DEFAULT_TIMEOUT_MS = 5000

let nextId = 0

export const useAlertStore = defineStore('alerts', {
  state: () => ({
    items: [] as Alert[]
  }),

  actions: {
    push(color: AlertColor, title: string, description?: string, timeoutMs = DEFAULT_TIMEOUT_MS): number {
      const id = ++nextId
      this.items.push({ id, color, title, description })

      if (timeoutMs > 0) {
        setTimeout(() => this.dismiss(id), timeoutMs)
      }

      return id
    },

    error(title: string, description?: string) {
      return this.push('error', title, description)
    },

    success(title: string, description?: string) {
      return this.push('success', title, description)
    },

    warning(title: string, description?: string) {
      return this.push('warning', title, description)
    },

    info(title: string, description?: string) {
      return this.push('info', title, description)
    },

    dismiss(id: number) {
      this.items = this.items.filter(item => item.id !== id)
    },

    clear() {
      this.items = []
    }
  }
})
