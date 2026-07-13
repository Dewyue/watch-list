import type { Movie, OtherItem, TVShow } from '../types'

export type DetailLine = { label: string; value: string }

export function buildMovieDetails(movie: Movie): DetailLine[] {
  return [
    { label: '简介', value: movie.synopsis ?? '' },
    { label: '备注', value: movie.note ?? '' },
    { label: '时长', value: movie.duration ?? '' },
    { label: '主演', value: movie.actors?.join('、') ?? '' },
    { label: '导演', value: movie.director ?? '' },
  ]
}

export function buildTVDetails(show: TVShow): DetailLine[] {
  const seasonEp =
    show.seasons != null || show.episodes != null
      ? `${show.seasons ?? '?'} 季 · ${show.episodes ?? '?'} 集`
      : ''

  return [
    { label: '简介', value: show.synopsis ?? '' },
    { label: '备注', value: show.note ?? '' },
    { label: '进度', value: show.progress ?? '' },
    { label: '季数/集数', value: seasonEp },
    { label: '主演', value: show.actors?.join('、') ?? '' },
    { label: '国家', value: show.country ?? '' },
    { label: '类别', value: show.genre ?? '' },
    { label: '平台', value: show.platform ?? '' },
  ]
}

export function buildOtherDetails(item: OtherItem): DetailLine[] {
  const seasonEp =
    item.seasons != null || item.episodes != null
      ? `${item.seasons ?? '?'} 季 · ${item.episodes ?? '?'} 集`
      : ''

  return [
    { label: '简介', value: item.synopsis ?? '' },
    { label: '备注', value: item.note ?? '' },
    { label: '进度', value: item.progress ?? '' },
    { label: '时长', value: item.duration ?? '' },
    { label: '季数/集数', value: seasonEp },
    { label: '主演', value: item.actors?.join('、') ?? '' },
    { label: '导演', value: item.director ?? '' },
    { label: '国家', value: item.country ?? '' },
    { label: '类别', value: item.genre ?? '' },
    { label: '平台', value: item.platform ?? '' },
  ]
}

export function looksLikeUserNote(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false
  if (trimmed.length > 80) return false
  if (/[。！？]/.test(trimmed) && trimmed.length > 24) return false
  return true
}

export function migrateItemNotes<T extends { synopsis?: string; note?: string }>(item: T): T {
  if (item.note?.trim() || !item.synopsis?.trim()) return item
  if (!looksLikeUserNote(item.synopsis)) return item
  return {
    ...item,
    note: item.synopsis,
    synopsis: undefined,
  }
}
