import type { Movie, OtherItem, SectionKey, TVShow, WatchlistData } from '../types'
import { SECTIONS } from '../types'

const SECTION_KEYS: SectionKey[] = ['watching', 'urgent', 'unfinished', 'todo']

export function validateWatchlistData(data: unknown): data is WatchlistData {
  if (!data || typeof data !== 'object') return false
  const record = data as WatchlistData
  if (!record.sections || typeof record.sections !== 'object') return false

  for (const key of SECTION_KEYS) {
    const section = record.sections[key]
    if (!section || !Array.isArray(section.movies) || !Array.isArray(section.tvShows)) {
      return false
    }
  }

  return Array.isArray(record.others)
}

export function normalizeWatchlistData(data: WatchlistData): WatchlistData {
  const next = structuredClone(data)
  for (const key of SECTION_KEYS) {
    next.sections[key] ??= { movies: [], tvShows: [] }
    next.sections[key].movies ??= []
    next.sections[key].tvShows ??= []
  }
  next.others ??= []
  next.version ??= 1
  return next
}

export function sectionLabels() {
  return SECTIONS.map((s) => s.label).join('、')
}

export function patchMovieInData(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  patch: Partial<Movie>,
) {
  const item = data.sections[section].movies.find((entry) => entry.id === id)
  if (item) Object.assign(item, patch)
}

export function patchTVInData(
  data: WatchlistData,
  section: SectionKey,
  id: string,
  patch: Partial<TVShow>,
) {
  const item = data.sections[section].tvShows.find((entry) => entry.id === id)
  if (item) Object.assign(item, patch)
}

export function patchOtherInData(data: WatchlistData, id: string, patch: Partial<OtherItem>) {
  const item = data.others.find((entry) => entry.id === id)
  if (item) Object.assign(item, patch)
}
