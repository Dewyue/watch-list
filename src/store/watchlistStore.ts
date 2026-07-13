import type { Movie, OtherItem, SectionKey, TVShow, WatchlistData } from '../types'
import seedData from '../../data/watchlist.json'

const STORAGE_KEY = 'watch-list-data'

export type MediaKind = 'movie' | 'tv'

export type MovieItem = Movie & { id: string }
export type TVShowItem = TVShow & { id: string }
export type OtherItemWithId = OtherItem & { id: string }

function createId() {
  return crypto.randomUUID()
}

function withIds<T extends object>(items: T[]): (T & { id: string })[] {
  return items.map((item) => ({
    ...item,
    id: 'id' in item && typeof item.id === 'string' ? item.id : createId(),
  }))
}

export function seedWatchlist(): WatchlistData {
  const raw = structuredClone(seedData) as WatchlistData
  return ensureIds(raw)
}

export function ensureIds(data: WatchlistData): WatchlistData {
  const next = structuredClone(data)

  for (const key of Object.keys(next.sections) as SectionKey[]) {
    next.sections[key] = {
      movies: withIds(next.sections[key].movies ?? []),
      tvShows: withIds(next.sections[key].tvShows ?? []),
    }
  }

  next.others = withIds(next.others ?? [])
  return next
}

export function loadWatchlistFromStorage(): WatchlistData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      const fresh = seedWatchlist()
      saveWatchlistToStorage(fresh)
      return fresh
    }
    const parsed = ensureIds(JSON.parse(saved) as WatchlistData)
    saveWatchlistToStorage(parsed)
    return parsed
  } catch {
    const fresh = seedWatchlist()
    saveWatchlistToStorage(fresh)
    return fresh
  }
}

export function saveWatchlistToStorage(data: WatchlistData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetWatchlistStorage(): WatchlistData {
  const fresh = seedWatchlist()
  saveWatchlistToStorage(fresh)
  return fresh
}

export function findItem(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  kind: MediaKind,
): MovieItem | TVShowItem | undefined {
  const list = kind === 'movie' ? data.sections[section].movies : data.sections[section].tvShows
  return list.find((item) => item.id === id) as MovieItem | TVShowItem | undefined
}

export function updateProgress(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  kind: MediaKind,
  progress: string,
): WatchlistData {
  const next = structuredClone(data)
  const list = kind === 'movie' ? next.sections[section].movies : next.sections[section].tvShows
  const item = list.find((entry) => entry.id === id)
  if (!item) return data
  if (kind === 'tv') {
    ;(item as TVShowItem).progress = progress || undefined
  }
  return next
}

export function moveItem(
  data: WatchlistData,
  from: SectionKey,
  to: SectionKey,
  id: string,
  kind: MediaKind,
  options?: { progress?: string },
): WatchlistData {
  const next = structuredClone(data)
  const source = kind === 'movie' ? next.sections[from].movies : next.sections[from].tvShows
  const index = source.findIndex((item) => item.id === id)
  if (index < 0) return data

  const [item] = source.splice(index, 1) as [MovieItem] | [TVShowItem]
  if (kind === 'tv' && options?.progress !== undefined) {
    ;(item as TVShowItem).progress = options.progress || undefined
  }

  const target = kind === 'movie' ? next.sections[to].movies : next.sections[to].tvShows
  target.push(item as never)

  return next
}

export function deleteItem(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  kind: MediaKind,
): WatchlistData {
  const next = structuredClone(data)
  if (kind === 'movie') {
    next.sections[section].movies = next.sections[section].movies.filter((item) => item.id !== id)
  } else {
    next.sections[section].tvShows = next.sections[section].tvShows.filter((item) => item.id !== id)
  }
  return next
}

export function addMovie(data: WatchlistData, section: SectionKey, movie: Movie): WatchlistData {
  const next = structuredClone(data)
  next.sections[section].movies.push({
    ...movie,
    id: movie.id ?? createId(),
  })
  return next
}

export function addTVShow(data: WatchlistData, section: SectionKey, show: TVShow): WatchlistData {
  const next = structuredClone(data)
  next.sections[section].tvShows.push({
    ...show,
    id: show.id ?? createId(),
    progress: show.progress ?? (section === 'watching' ? 'S1E1' : undefined),
  })
  return next
}

export function addOtherItem(data: WatchlistData, item: OtherItem): WatchlistData {
  const next = structuredClone(data)
  next.others.push({
    ...item,
    id: item.id ?? createId(),
  })
  return next
}

export function patchMovie(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  patch: Partial<Movie>,
): WatchlistData {
  const next = structuredClone(data)
  const item = next.sections[section].movies.find((entry) => entry.id === id)
  if (!item) return data
  Object.assign(item, patch)
  return next
}

export function patchTVShow(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  patch: Partial<TVShow>,
): WatchlistData {
  const next = structuredClone(data)
  const item = next.sections[section].tvShows.find((entry) => entry.id === id)
  if (!item) return data
  Object.assign(item, patch)
  return next
}

export function patchOtherItem(
  data: WatchlistData,
  id: string,
  patch: Partial<OtherItem>,
): WatchlistData {
  const next = structuredClone(data)
  const item = next.others.find((entry) => entry.id === id)
  if (!item) return data
  Object.assign(item, patch)
  return next
}

export function exportWatchlist(data: WatchlistData): string {
  return JSON.stringify(data, null, 2)
}

export function importWatchlist(json: string): WatchlistData {
  const parsed = JSON.parse(json) as WatchlistData
  const seeded = seedWatchlist()
  seeded.sections = parsed.sections
  seeded.others = withIds(parsed.others ?? [])
  for (const key of Object.keys(seeded.sections) as SectionKey[]) {
    seeded.sections[key] = {
      movies: withIds(seeded.sections[key].movies ?? []),
      tvShows: withIds(seeded.sections[key].tvShows ?? []),
    }
  }
  saveWatchlistToStorage(seeded)
  return seeded
}
