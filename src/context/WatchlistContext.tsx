import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { MediaKind, MovieItem, TVShowItem } from '../store/watchlistStore'
import {
  deleteItem,
  exportWatchlist,
  importWatchlist,
  loadWatchlistFromStorage,
  moveItem,
  resetWatchlistStorage,
  saveWatchlistToStorage,
  updateProgress,
} from '../store/watchlistStore'
import type { SectionKey, WatchlistData } from '../types'

type WatchlistContextValue = {
  data: WatchlistData
  setProgress: (section: SectionKey, id: string, kind: MediaKind, progress: string) => void
  moveTo: (from: SectionKey, to: SectionKey, id: string, kind: MediaKind, progress?: string) => void
  remove: (section: SectionKey, id: string, kind: MediaKind) => void
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
