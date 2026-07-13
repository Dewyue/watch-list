const TMDB_KEY_STORAGE = 'watch-list-tmdb-key'

export function getTmdbApiKey(): string {
  return localStorage.getItem(TMDB_KEY_STORAGE)?.trim() ?? ''
}

export function setTmdbApiKey(key: string) {
  localStorage.setItem(TMDB_KEY_STORAGE, key.trim())
}

const TMDB_BASE = 'https://api.themoviedb.org/3'

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
  media_type?: string
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

async function tmdbFetch<T>(path: string, apiKey: string): Promise<T> {
  const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${apiKey}&language=zh-CN`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'TMDB API Key 无效' : `TMDB 请求失败 (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function searchTmdb(
  query: string,
  kind: 'movie' | 'tv',
  apiKey: string,
): Promise<TmdbSearchHit[]> {
  const endpoint = kind === 'movie' ? '/search/movie' : '/search/tv'
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(
    `${endpoint}?query=${encodeURIComponent(query)}`,
    apiKey,
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
  const data = await tmdbFetch<TmdbTVDetail>(`/tv/${id}?append_to_response=credits`, apiKey)

  const platform = data.networks?.[0]?.name

  return {
    title: data.name,
    country: mapCountry(data.origin_country),
    genre: mapGenre(data.genres),
    platform,
    synopsis: data.overview || undefined,
    seasons: data.number_of_seasons,
    episodes: data.number_of_episodes,
  }
}

export type LookupResult =
  | (Awaited<ReturnType<typeof fetchMovieDetails>> & { needPick?: never })
  | (Awaited<ReturnType<typeof fetchTVDetails>> & { needPick?: never })
  | { needPick: true; hits: TmdbSearchHit[] }

export async function lookupMedia(
  title: string,
  kind: 'movie' | 'tv',
  apiKey: string,
  pickId?: number,
): Promise<LookupResult> {
  if (pickId) {
    return kind === 'movie' ? fetchMovieDetails(pickId, apiKey) : fetchTVDetails(pickId, apiKey)
  }

  const hits = await searchTmdb(title, kind, apiKey)
  if (hits.length === 0) {
    throw new Error('未找到匹配结果，请检查片名或尝试英文原名')
  }
  if (hits.length === 1) {
    return kind === 'movie'
      ? fetchMovieDetails(hits[0].id, apiKey)
      : fetchTVDetails(hits[0].id, apiKey)
  }

  return { needPick: true as const, hits }
}

export function isDocumentaryGenre(genre: string) {
  return genre === '纪录片'
}

export function isAnimationGenre(genre: string) {
  return genre === '动画'
}
