import { FetchError } from 'ofetch'
import { useAuthStore } from '~/stores/auth'

type ApiFetchOptions = Parameters<typeof $fetch>[1]

/**
 * Wraps $fetch with the API base URL, an Authorization header, and a
 * one-shot silent refresh-and-retry when an access token has expired.
 */
export function useApi() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
    const request = (): Promise<T> => $fetch(path, {
      baseURL: config.public.apiBase,
      ...options,
      headers: {
        ...(options?.headers as Record<string, string> | undefined),
        ...(auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {})
      }
    }) as Promise<T>

    try {
      return await request()
    } catch (error) {
      const isUnauthorized = error instanceof FetchError && error.response?.status === 401

      if (isUnauthorized && auth.refreshToken) {
        const refreshed = await auth.refresh()
        if (refreshed) {
          return await request()
        }
        await navigateTo('/login')
      }

      throw error
    }
  }

  return { apiFetch }
}
