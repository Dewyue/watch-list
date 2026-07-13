import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MediaKind, MovieItem, TVShowItem } from '../store/watchlistStore'
import {
  addMovie,
  addOtherItem,
  addTVShow,
  deleteItem,
  deleteOtherItem,
  exportWatchlist,
  importWatchlist,
  loadWatchlistFromStorage,
  moveItem,
  patchMovie,
  patchOtherItem,
  patchTVShow,
  resetWatchlistStorage,
  saveWatchlistToStorage,
  updateProgress,
} from '../store/watchlistStore'
import type { Movie, OtherItem, SectionKey, TVShow, WatchlistData } from '../types'

type WatchlistContextValue = {
  data: WatchlistData
  setProgress: (section: SectionKey, id: string, kind: MediaKind, progress: string) => void
  moveTo: (from: SectionKey, to: SectionKey, id: string, kind: MediaKind, progress?: string) => void
  remove: (section: SectionKey, id: string, kind: MediaKind) => void
  removeOther: (id: string) => void
  addMovie: (section: SectionKey, movie: Movie) => string
  addTV: (section: SectionKey, show: TVShow) => string
  addOther: (item: OtherItem) => string
  patchMovieItem: (section: SectionKey, id: string, patch: Partial<Movie>) => void
  patchTVItem: (section: SectionKey, id: string, patch: Partial<TVShow>) => void
  patchOther: (id: string, patch: Partial<OtherItem>) => void
  reset: () => void
  exportJson: () => string
  importJson: (json: string) => void
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null)

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WatchlistData>(() => loadWatchlistFromStorage())

  const persist = useCallback((next: WatchlistData) => {
    setData(next)
    saveWatchlistToStorage(next)
  }, [])

  const value = useMemo<WatchlistContextValue>(
    () => ({
      data,
      setProgress: (section, id, kind, progress) => {
        persist(updateProgress(data, section, id, kind, progress))
      },
      moveTo: (from, to, id, kind, progress) => {
        persist(moveItem(data, from, to, id, kind, { progress }))
      },
      remove: (section, id, kind) => {
        persist(deleteItem(data, section, id, kind))
      },
      removeOther: (id) => {
        persist(deleteOtherItem(data, id))
      },
      addMovie: (section, movie) => {
        const id = movie.id ?? crypto.randomUUID()
        const next = addMovie(data, section, { ...movie, id })
        persist(next)
        return id
      },
      addTV: (section, show) => {
        const id = show.id ?? crypto.randomUUID()
        const next = addTVShow(data, section, { ...show, id })
        persist(next)
        return id
      },
      addOther: (item) => {
        const id = item.id ?? crypto.randomUUID()
        const next = addOtherItem(data, { ...item, id })
        persist(next)
        return id
      },
      patchMovieItem: (section, id, patch) => {
        persist(patchMovie(data, section, id, patch))
      },
      patchTVItem: (section, id, patch) => {
        persist(patchTVShow(data, section, id, patch))
      },
      patchOther: (id, patch) => {
        persist(patchOtherItem(data, id, patch))
      },
      reset: () => {
        persist(resetWatchlistStorage())
      },
      exportJson: () => exportWatchlist(data),
      importJson: (json) => {
        persist(importWatchlist(json))
      },
    }),
    [data, persist],
  )

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext)
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider')
  return ctx
}

export type ListEntry = {
  id: string
  kind: MediaKind
  title: string
  progress?: string
  raw: MovieItem | TVShowItem
}

export function getSectionEntries(
  data: WatchlistData,
  section: SectionKey,
): ListEntry[] {
  const sectionData = data.sections[section]
  return [
    ...sectionData.tvShows.map((item) => ({
      id: item.id ?? item.title,
      kind: 'tv' as const,
      title: item.title,
      progress: item.progress,
      raw: item as TVShowItem,
    })),
    ...sectionData.movies.map((item) => ({
      id: item.id ?? item.title,
      kind: 'movie' as const,
      title: item.title,
      progress: undefined,
      raw: item as MovieItem,
    })),
  ]
}
