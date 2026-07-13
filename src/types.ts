export type SectionKey = 'watching' | 'urgent' | 'unfinished' | 'todo'

export type OtherType = 'anime' | 'manga' | 'documentary' | 'other'

export type TVGroupMode = 'country' | 'genre' | 'platform'

export interface Movie {
  title: string
  genre: string
  synopsis?: string
  duration?: string
  actors?: string[]
  director?: string
}

export interface TVShow {
  title: string
  country?: string
  genre?: string
  platform?: string
  synopsis?: string
  seasons?: number
  episodes?: number
}

export interface SectionContent {
  movies: Movie[]
  tvShows: TVShow[]
}

export interface OtherItem {
  title: string
  type: OtherType
  synopsis?: string
  progress?: string
}

export interface WatchlistData {
  version: number
  sections: Record<SectionKey, SectionContent>
  others: OtherItem[]
}

export type NavKey = SectionKey | 'others'

export const SECTIONS: { key: NavKey; label: string; path: string }[] = [
  { key: 'watching', label: '正在看', path: '/watching' },
  { key: 'urgent', label: '抓紧看', path: '/urgent' },
  { key: 'unfinished', label: '没看完', path: '/unfinished' },
  { key: 'todo', label: '待看', path: '/todo' },
  { key: 'others', label: '其他', path: '/others' },
]

export const OTHER_TYPE_LABELS: Record<OtherType, string> = {
  anime: '动漫',
  manga: '漫画',
  documentary: '纪录片',
  other: '其他',
}

export const TV_GROUP_MODES: { key: TVGroupMode; label: string }[] = [
  { key: 'country', label: '国家' },
  { key: 'genre', label: '类别' },
  { key: 'platform', label: '平台' },
]

export function groupBy<T>(items: T[], getKey: (item: T) => string | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>()

  for (const item of items) {
    const key = getKey(item)?.trim() || '未分类'
    const group = map.get(key)
    if (group) {
      group.push(item)
    } else {
      map.set(key, [item])
    }
  }

  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'zh-CN')))
}

export function getMovieGroups(movies: Movie[]): Map<string, Movie[]> {
  return groupBy(movies, (movie) => movie.genre)
}

export function getTVGroups(tvShows: TVShow[], mode: TVGroupMode): Map<string, TVShow[]> {
  const getter =
    mode === 'country'
      ? (show: TVShow) => show.country
      : mode === 'genre'
        ? (show: TVShow) => show.genre
        : (show: TVShow) => show.platform

  return groupBy(tvShows, getter)
}

export function getOtherGroups(items: OtherItem[]): Map<string, OtherItem[]> {
  return groupBy(items, (item) => OTHER_TYPE_LABELS[item.type] ?? OTHER_TYPE_LABELS.other)
}
