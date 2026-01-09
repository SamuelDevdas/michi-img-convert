export function normalizeInputPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}

export function isUNCPath(value: string): boolean {
  const normalized = normalizeInputPath(value)
  return normalized.startsWith('\\\\')
}

export function isWindowsDrivePath(value: string): boolean {
  const normalized = normalizeInputPath(value)
  return /^[a-zA-Z]:[\\/]/.test(normalized)
}

export function getWindowsDriveLetter(value: string): string | null {
  if (!isWindowsDrivePath(value)) return null
  return normalizeInputPath(value).charAt(0).toUpperCase()
}
