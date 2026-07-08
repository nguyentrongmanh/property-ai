export function formatEnumLabel(value: string | null | undefined): string {
  if (!value) return ''

  return value
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}