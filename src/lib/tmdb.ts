import { readTmdbCache, writeTmdbCache } from './tmdbCache'
import type { OtherItem } from '../types'

const TMDB_KEY_STORAGE = 'watch-list-tmdb-key'
const TMDB_BASE = 'https://api.themoviedb.org/3'
const FETCH_TIMEOUT_MS = 8000

export function getTmdbApiKey(): string {
  return localStorage.getItem(TMDB_KEY_STORAGE)?.trim() ?? ''
}

export function setTmdbApiKey(key: string) {
  localStorage.setItem(TMDB_KEY_STORAGE, key.trim())
}

const GENRE_ZH: Record<string, string> = {
  Action: '动作',
  Adventure: '冒险',
  Animation: '动画',
  Comedy: '喜剧',
  Crime: '犯罪',
  Documentary: '纪录片',
  Drama: '剧情',
  Family: '家庭',
  Fantasy: '奇幻',
  History: '历史',
  Horror: '恐怖',
  Music: '音乐',
  Mystery: '悬疑',
  Romance: '爱情',
  'Science Fiction': '科幻',
  'TV Movie': '电视电影',
  Thriller: '惊悚',
  War: '战争',
  Western: '西部',
}

const COUNTRY_ZH: Record<string, string> = {
  CN: '中国',
  TW: '中国台湾',
  HK: '中国香港',
  US: '美国',
  GB: '英国',
  KR: '韩国',
  JP: '日本',
  ES: '西班牙',
  DE: '德国',
  FR: '法国',
  IT: '意大利',
  CA: '加拿大',
  AU: '澳大利亚',
  IN: '印度',
  TH: '泰国',
}

type TmdbGenre = { id: number; name: string }

type TmdbSearchResult = {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  overview?: string
}

type TmdbMovieDetail = {
  title: string
  overview: string
  runtime?: number
  genres: TmdbGenre[]
  production_countries?: { iso_3166_1: string; name: string }[]
  credits?: {
    cast?: { name: string }[]
    crew?: { name: string; job: string }[]
  }
}

type TmdbTVDetail = {
  name: string
  overview: string
  number_of_seasons?: number
  number_of_episodes?: number
  genres: TmdbGenre[]
  origin_country?: string[]
  networks?: { name: string }[]
  credits?: {
    cast?: { name: string }[]
  }
}

export type TmdbSearchHit = {
  id: number
  title: string
  year?: string
  overview?: string
  kind: 'movie' | 'tv'
}

function mapGenre(genres: TmdbGenre[]): string {
  if (!genres.length) return '未分类'
  const primary = genres[0].name
  return GENRE_ZH[primary] ?? primary
}

function mapCountry(codes: string[] | undefined, countries?: { iso_3166_1: string }[]): string {
  const code = codes?.[0] ?? countries?.[0]?.iso_3166_1
  if (!code) return '未分类'
  return COUNTRY_ZH[code] ?? code
}

async function tmdbFetch<T>(path: string, apiKey: string, cacheKey: string): Promise<T> {
  const cached = readTmdbCache<T>(cacheKey)
  if (cached) return cached

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${apiKey}&language=zh-CN`
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(res.status === 401 ? 'TMDB API Key 无效' : `TMDB 请求失败 (${res.status})`)
    }
    const data = (await res.json()) as T
    writeTmdbCache(cacheKey, data)
    return data
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('查询超时，请稍后重试或使用「仅添加名称」')
    }
    throw err
  } finally {
    window.clearTimeout(timer)
  }
}

export function cleanSearchTitle(title: string): string {
  const cleaned = title
    .replace(/[（(].*[)）]/g, '')
    .replace(/第\s*[\d、，]+\s*季/g, '')
    .replace(/第?\d+季$/u, '')
    .replace(/\s+season\s*\d+$/i, '')
    .replace(/\d+$/u, '')
    .trim()
  return cleaned || title
}

export async function searchTmdb(
  query: string,
  kind: 'movie' | 'tv',
  apiKey: string,
): Promise<TmdbSearchHit[]> {
  const endpoint = kind === 'movie' ? '/search/movie' : '/search/tv'
  const cacheKey = `search:${kind}:${query.trim().toLowerCase()}`
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    `${endpoint}?query=${encodeURIComponent(query)}`,
    apiKey,
    cacheKey,
  )

  return (data.results ?? []).slice(0, 5).map((item) => ({
    id: item.id,
    title: (kind === 'movie' ? item.title : item.name) ?? query,
    year: (kind === 'movie' ? item.release_date : item.first_air_date)?.slice(0, 4),
    overview: item.overview,
    kind,
  }))
}

export async function fetchMovieDetails(id: number, apiKey: string) {
  const data = await tmdbFetch<TmdbMovieDetail>(
    `/movie/${id}?append_to_response=credits`,
    apiKey,
    `movie:${id}`,
  )

  const director = data.credits?.crew?.find((person) => person.job === 'Director')?.name
  const actors = data.credits?.cast?.slice(0, 5).map((person) => person.name) ?? []

  return {
    title: data.title,
    genre: mapGenre(data.genres),
    synopsis: data.overview || undefined,
    duration: data.runtime ? `${data.runtime}分钟` : undefined,
    actors: actors.length ? actors : undefined,
    director,
  }
}

export async function fetchTVDetails(id: number, apiKey: string) {
  const data = await tmdbFetch<TmdbTVDetail>(
    `/tv/${id}?append_to_response=credits`,
    apiKey,
    `tv:${id}`,
  )

  const platform = data.networks?.[0]?.name
  const actors = data.credits?.cast?.slice(0, 5).map((person) => person.name) ?? []

  return {
    title: data.name,
    country: mapCountry(data.origin_country),
    genre: mapGenre(data.genres),
    platform,
    synopsis: data.overview || undefined,
    actors: actors.length ? actors : undefined,
    seasons: data.number_of_seasons,
    episodes: data.number_of_episodes,
  }
}

export function movieFromHit(hit: TmdbSearchHit) {
  return {
    title: hit.title,
    genre: '未分类',
    synopsis: hit.overview || undefined,
  }
}

export function tvFromHit(hit: TmdbSearchHit) {
  return {
    title: hit.title,
    country: '未分类',
    genre: '未分类',
    synopsis: hit.overview || undefined,
  }
}

export async function enrichMovie(id: number, apiKey: string) {
  return fetchMovieDetails(id, apiKey)
}

export async function enrichTV(id: number, apiKey: string) {
  return fetchTVDetails(id, apiKey)
}

export function otherPatchFromMovie(movie: Awaited<ReturnType<typeof fetchMovieDetails>>): Partial<OtherItem> {
  return {
    title: movie.title,
    synopsis: movie.synopsis,
    duration: movie.duration,
    actors: movie.actors,
    director: movie.director,
    genre: movie.genre,
  }
}

export function otherPatchFromTV(show: Awaited<ReturnType<typeof fetchTVDetails>>): Partial<OtherItem> {
  return {
    title: show.title,
    synopsis: show.synopsis,
    country: show.country,
    genre: show.genre,
    platform: show.platform,
    actors: show.actors,
    seasons: show.seasons,
    episodes: show.episodes,
  }
}
