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

  const apply = useCallback((updater: (prev: WatchlistData) => WatchlistData) => {
    setData((prev) => {
      const next = updater(prev)
      saveWatchlistToStorage(next)
      return next
    })
  }, [])

  const setProgress = useCallback(
    (section: SectionKey, id: string, kind: MediaKind, progress: string) => {
      apply((prev) => updateProgress(prev, section, id, kind, progress))
    },
    [apply],
  )

  const moveTo = useCallback(
    (from: SectionKey, to: SectionKey, id: string, kind: MediaKind, progress?: string) => {
      apply((prev) => moveItem(prev, from, to, id, kind, { progress }))
    },
    [apply],
  )

  const remove = useCallback(
    (section: SectionKey, id: string, kind: MediaKind) => {
      apply((prev) => deleteItem(prev, section, id, kind))
    },
    [apply],
  )

  const removeOther = useCallback(
    (id: string) => {
      apply((prev) => deleteOtherItem(prev, id))
    },
    [apply],
  )

  const addMovieItem = useCallback(
    (section: SectionKey, movie: Movie) => {
      const id = movie.id ?? crypto.randomUUID()
      apply((prev) => addMovie(prev, section, { ...movie, id }))
      return id
    },
    [apply],
  )

  const addTVItem = useCallback(
    (section: SectionKey, show: TVShow) => {
      const id = show.id ?? crypto.randomUUID()
      apply((prev) => addTVShow(prev, section, { ...show, id }))
      return id
    },
    [apply],
  )

  const addOther = useCallback(
    (item: OtherItem) => {
      const id = item.id ?? crypto.randomUUID()
      apply((prev) => addOtherItem(prev, { ...item, id }))
      return id
    },
    [apply],
  )

  const patchMovieItem = useCallback(
    (section: SectionKey, id: string, patch: Partial<Movie>) => {
      apply((prev) => patchMovie(prev, section, id, patch))
    },
    [apply],
  )

  const patchTVItem = useCallback(
    (section: SectionKey, id: string, patch: Partial<TVShow>) => {
      apply((prev) => patchTVShow(prev, section, id, patch))
    },
    [apply],
  )

  const patchOther = useCallback(
    (id: string, patch: Partial<OtherItem>) => {
      apply((prev) => patchOtherItem(prev, id, patch))
    },
    [apply],
  )

  const reset = useCallback(() => {
    apply(() => resetWatchlistStorage())
  }, [apply])

  const exportJson = useCallback(() => exportWatchlist(data), [data])

  const importJson = useCallback(
    (json: string) => {
      apply(() => importWatchlist(json))
    },
    [apply],
  )

  const value = useMemo<WatchlistContextValue>(
    () => ({
      data,
      setProgress,
      moveTo,
      remove,
      removeOther,
      addMovie: addMovieItem,
      addTV: addTVItem,
      addOther,
      patchMovieItem,
      patchTVItem,
      patchOther,
      reset,
      exportJson,
      importJson,
    }),
    [
      data,
      setProgress,
      moveTo,
      remove,
      removeOther,
      addMovieItem,
      addTVItem,
      addOther,
      patchMovieItem,
      patchTVItem,
      patchOther,
      reset,
      exportJson,
      importJson,
    ],
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
