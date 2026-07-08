import { defineStore } from 'pinia'
import type { AuthUser } from '~/types/api'

interface AuthTokens {
  access_token: string
  refresh_token: string
}

interface Credentials {
  email: string
  password: string
}

function tokenCookie(name: string) {
  return useCookie<string | null>(name, {
    default: () => null,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  })
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    refreshToken: null as string | null,
    hydrated: false
  }),

  getters: {
    isAuthenticated: state => !!state.accessToken
  },

  actions: {
    hydrate() {
      if (this.hydrated) return
      this.accessToken = tokenCookie('access_token').value
      this.refreshToken = tokenCookie('refresh_token').value
      this.user = useCookie<AuthUser | null>('auth_user', { default: () => null }).value
      this.hydrated = true
    },

    persist() {
      tokenCookie('access_token').value = this.accessToken
      tokenCookie('refresh_token').value = this.refreshToken
      useCookie<AuthUser | null>('auth_user').value = this.user
    },

    setSession(tokens: AuthTokens, user: AuthUser) {
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      this.user = user
      this.hydrated = true
      this.persist()
    },

    clearSession() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.persist()
    },

    async register(payload: { name: string, email: string, password: string }) {
      const apiBase = useRuntimeConfig().public.apiBase
      const res = await $fetch<{ data: AuthTokens & { user: AuthUser } }>(`${apiBase}/auth/register`, {
        method: 'POST',
        body: payload
      })
      this.setSession(res.data, res.data.user)
    },

    async login(credentials: Credentials) {
      const apiBase = useRuntimeConfig().public.apiBase
      const res = await $fetch<{ data: AuthTokens & { user: AuthUser } }>(`${apiBase}/auth/login`, {
        method: 'POST',
        body: credentials
      })
      this.setSession(res.data, res.data.user)
    },

    async refresh(): Promise<boolean> {
      if (!this.refreshToken) return false

      const apiBase = useRuntimeConfig().public.apiBase
      try {
        const res = await $fetch<{ data: AuthTokens & { user?: AuthUser } }>(`${apiBase}/auth/refresh`, {
          method: 'POST',
          body: { refresh_token: this.refreshToken }
        })
        this.accessToken = res.data.access_token
        this.refreshToken = res.data.refresh_token
        this.persist()
        return true
      } catch {
        this.clearSession()
        return false
      }
    },

    async logout() {
      const apiBase = useRuntimeConfig().public.apiBase
      if (this.refreshToken) {
        await $fetch(`${apiBase}/auth/logout`, {
          method: 'POST',
          body: { refresh_token: this.refreshToken }
        }).catch(() => undefined)
      }
      this.clearSession()
    }
  }
})
