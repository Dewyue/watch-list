import { enrichMovie, enrichTV, getTmdbApiKey, searchTmdb, type TmdbSearchHit } from './tmdb'
import type { MediaKind } from '../store/watchlistStore'

export type EnrichDetails =
  | Awaited<ReturnType<typeof enrichMovie>>
  | Awaited<ReturnType<typeof enrichTV>>

export async function enrichItemFromTmdb(
  title: string,
  kind: MediaKind,
  pickId?: number,
): Promise<{ details: EnrichDetails; kind: MediaKind } | { needPick: true; hits: TmdbSearchHit[] }> {
  const apiKey = getTmdbApiKey()
  if (!apiKey) throw new Error('请先在「数据」页配置 TMDB API Key')

  if (pickId) {
    const details =
      kind === 'movie' ? await enrichMovie(pickId, apiKey) : await enrichTV(pickId, apiKey)
    return { details, kind }
  }

  const hits = await searchTmdb(title, kind, apiKey)
  if (hits.length === 0) {
    throw new Error('未找到匹配结果，可改试英文原名')
  }
  if (hits.length > 1) {
    return { needPick: true, hits }
  }

  const details =
    hits[0].kind === 'movie'
      ? await enrichMovie(hits[0].id, apiKey)
      : await enrichTV(hits[0].id, apiKey)

  return { details, kind: hits[0].kind }
}
