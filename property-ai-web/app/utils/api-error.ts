import { FetchError } from 'ofetch'

export function apiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (error instanceof FetchError) {
    const data = error.data as { message?: string } | undefined
    return data?.message ?? fallback
  }
  return fallback
}

export function apiFieldErrors(error: unknown): Record<string, string[]> {
  if (error instanceof FetchError) {
    const data = error.data as { errors?: Record<string, string[]> } | undefined
    return data?.errors ?? {}
  }
  return {}
}
