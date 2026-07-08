import { useAuthStore } from '~/stores/auth'

const PUBLIC_PAGES = ['/login', '/register']

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()
  auth.hydrate()

  if (PUBLIC_PAGES.includes(to.path)) {
    if (auth.isAuthenticated) {
      return navigateTo('/properties')
    }
    return
  }

  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
})
