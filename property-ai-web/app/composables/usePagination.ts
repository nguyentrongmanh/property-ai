import type { PaginationMeta } from '~/types/api'

export function usePagination(meta: Ref<PaginationMeta | null>, initialPage = 1) {
  const page = ref(initialPage)

  const lastPage = computed(() => meta.value?.last_page ?? 1)
  const canPrevPage = computed(() => page.value > 1)
  const canNextPage = computed(() => page.value < lastPage.value)

  function resetPage() {
    page.value = initialPage
  }

  function prevPage() {
    if (!canPrevPage.value) return
    page.value -= 1
  }

  function nextPage() {
    if (!canNextPage.value) return
    page.value += 1
  }

  return {
    page,
    canPrevPage,
    canNextPage,
    resetPage,
    prevPage,
    nextPage
  }
}