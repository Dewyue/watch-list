import watchlistJson from '../../data/watchlist.json'
import type { SectionKey, WatchlistData } from '../types'

const data = watchlistJson as WatchlistData

export function loadWatchlist(): WatchlistData {
  return data
}

export function getSection(key: SectionKey) {
  return data.sections[key]
}

export function getOthers() {
  return data.others
}
