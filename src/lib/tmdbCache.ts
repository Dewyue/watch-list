const CACHE_PREFIX = 'watch-list-tmdb-cache:'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

type CacheEntry = {
  savedAt: number
  data: unknown
}

export function readTmdbCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.savedAt > CACHE_TTL_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
      return null
    }
    return entry.data as T
  } catch {
    return null
  }
}

export function writeTmdbCache(key: string, data: unknown) {
  try {
    const entry: CacheEntry = { savedAt: Date.now(), data }
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
  } catch {
    // ignore quota errors
  }
}
