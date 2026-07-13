import { enrichMovie, enrichTV, getTmdbApiKey, searchTmdb, cleanSearchTitle, type TmdbSearchHit } from './tmdb'
import type { MediaKind } from '../store/watchlistStore'

export type EnrichDetails =
  | Awaited<ReturnType<typeof enrichMovie>>
  | Awaited<ReturnType<typeof enrichTV>>

async function searchWithFallback(title: string, kind: MediaKind, apiKey: string) {
  const queries = [...new Set([title.trim(), cleanSearchTitle(title)])]
  for (const query of queries) {
    const hits = await searchTmdb(query, kind, apiKey)
    if (hits.length > 0) return hits
  }
  return []
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const message = err instanceof Error ? err.message : ''
    if (!message.includes('超时')) throw err
    await new Promise((r) => window.setTimeout(r, 600))
    return fn()
  }
}

export async function enrichItemFromTmdb(
  title: string,
  kind: MediaKind,
  pickId?: number,
): Promise<{ details: EnrichDetails; kind: MediaKind } | { needPick: true; hits: TmdbSearchHit[] }> {
  const apiKey = getTmdbApiKey()
  if (!apiKey) throw new Error('请先在「数据」页配置 TMDB API Key')

  if (pickId) {
    const details: EnrichDetails = await withRetry(async () =>
      kind === 'movie' ? enrichMovie(pickId, apiKey) : enrichTV(pickId, apiKey),
    )
    return { details, kind }
  }

  const hits = await withRetry(() => searchWithFallback(title, kind, apiKey))
  if (hits.length === 0) {
    throw new Error('未找到匹配结果，可改试英文原名')
  }
  if (hits.length > 1) {
    return { needPick: true, hits }
  }

  const details: EnrichDetails = await withRetry(async () =>
    hits[0].kind === 'movie'
      ? enrichMovie(hits[0].id, apiKey)
      : enrichTV(hits[0].id, apiKey),
  )

  return { details, kind: hits[0].kind }
}
