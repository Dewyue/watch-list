/**
 * Batch enrich data/watchlist.json from TMDB.
 * Usage: TMDB_API_KEY=xxx bun run scripts/enrich_watchlist.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const API_KEY = process.env.TMDB_API_KEY?.trim()
const ROOT = resolve(import.meta.dir, '..')
const DATA_PATH = resolve(ROOT, 'data/watchlist.json')
const LOG_PATH = resolve(ROOT, 'scripts/enrich-log.txt')
const TMDB_BASE = 'https://api.themoviedb.org/3'
const DELAY_MS = 280

if (!API_KEY) {
  console.error('请设置环境变量 TMDB_API_KEY')
  process.exit(1)
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

type WatchlistData = {
  version: number
  sections: Record<
    string,
    {
      movies: Movie[]
      tvShows: TVShow[]
    }
  >
  others: OtherItem[]
}

type Movie = {
  title: string
  genre: string
  synopsis?: string
  note?: string
  duration?: string
  actors?: string[]
  director?: string
}

type TVShow = {
  title: string
  country?: string
  genre?: string
  platform?: string
  synopsis?: string
  note?: string
  progress?: string
  actors?: string[]
  seasons?: number
  episodes?: number
}

type OtherItem = {
  title: string
  type: string
  actor?: string
  synopsis?: string
  note?: string
  progress?: string
  duration?: string
  actors?: string[]
  director?: string
  country?: string
  genre?: string
  platform?: string
  seasons?: number
  episodes?: number
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function mapGenre(genres: { name: string }[]): string {
  if (!genres.length) return '未分类'
  const primary = genres[0].name
  return GENRE_ZH[primary] ?? primary
}

function mapCountry(codes?: string[]): string {
  const code = codes?.[0]
  if (!code) return '未分类'
  return COUNTRY_ZH[code] ?? code
}

function cleanSearchTitle(title: string): string {
  const cleaned = title
    .replace(/[（(].*[)）]/g, '')
    .replace(/第\s*[\d、，]+\s*季/g, '')
    .replace(/第?\d+季$/u, '')
    .replace(/\s+season\s*\d+$/i, '')
    .replace(/\d+$/u, '')
    .trim()
  return cleaned || title
}

async function tmdbFetch<T>(path: string): Promise<T> {
  const url = `${TMDB_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${API_KEY}&language=zh-CN`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`TMDB ${res.status}`)
    }
    return (await res.json()) as T
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('超时')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

async function searchTmdb(query: string, kind: 'movie' | 'tv') {
  const endpoint = kind === 'movie' ? '/search/movie' : '/search/tv'
  const data = await tmdbFetch<{ results: { id: number }[] }>(
    `${endpoint}?query=${encodeURIComponent(query)}`,
  )
  return data.results?.[0]?.id
}

async function resolveId(title: string, kind: 'movie' | 'tv') {
  const queries = [...new Set([cleanSearchTitle(title), title])]
  for (const query of queries) {
    const id = await searchTmdb(query, kind)
    if (id) return id
    await sleep(120)
  }
  return null
}

async function fetchMovieDetails(id: number) {
  const data = await tmdbFetch<{
    title: string
    overview: string
    runtime?: number
    genres: { name: string }[]
    credits?: {
      cast?: { name: string }[]
      crew?: { name: string; job: string }[]
    }
  }>(`/movie/${id}?append_to_response=credits`)

  const director = data.credits?.crew?.find((p) => p.job === 'Director')?.name
  const actors = data.credits?.cast?.slice(0, 5).map((p) => p.name) ?? []

  return {
    title: data.title,
    genre: mapGenre(data.genres),
    synopsis: data.overview || undefined,
    duration: data.runtime ? `${data.runtime}分钟` : undefined,
    actors: actors.length ? actors : undefined,
    director,
  }
}

async function fetchTVDetails(id: number) {
  const data = await tmdbFetch<{
    name: string
    overview: string
    number_of_seasons?: number
    number_of_episodes?: number
    genres: { name: string }[]
    origin_country?: string[]
    networks?: { name: string }[]
    credits?: { cast?: { name: string }[] }
  }>(`/tv/${id}?append_to_response=credits`)

  const actors = data.credits?.cast?.slice(0, 5).map((p) => p.name) ?? []

  return {
    title: data.name,
    country: mapCountry(data.origin_country),
    genre: mapGenre(data.genres),
    platform: data.networks?.[0]?.name,
    synopsis: data.overview || undefined,
    actors: actors.length ? actors : undefined,
    seasons: data.number_of_seasons,
    episodes: data.number_of_episodes,
  }
}

function applyMovie(item: Movie, patch: Partial<Movie>) {
  const note = item.note
  Object.assign(item, patch)
  if (note) item.note = note
}

function applyTV(item: TVShow, patch: Partial<TVShow>) {
  const note = item.note
  const progress = item.progress
  Object.assign(item, patch)
  if (note) item.note = note
  if (progress) item.progress = progress
}

function applyOther(item: OtherItem, patch: Partial<OtherItem>) {
  const note = item.note
  const progress = item.progress
  const actor = item.actor
  const type = item.type
  Object.assign(item, patch)
  item.type = type
  if (actor) item.actor = actor
  if (note) item.note = note
  if (progress) item.progress = progress
}

async function enrichTitle(title: string, kind: 'movie' | 'tv') {
  const id = await resolveId(title, kind)
  if (!id) throw new Error('未找到')
  return kind === 'movie' ? fetchMovieDetails(id) : fetchTVDetails(id)
}

function otherKind(type: string): 'movie' | 'tv' {
  return type === 'documentary' || type === 'star' ? 'movie' : 'tv'
}

async function main() {
  const data = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as WatchlistData
  const log: string[] = []
  let ok = 0
  let fail = 0
  let done = 0

  type Job = { label: string; run: () => Promise<void> }
  const jobs: Job[] = []

  const sections = Object.keys(data.sections)
  for (const section of sections) {
    for (const movie of data.sections[section].movies) {
      jobs.push({
        label: `movie [${section}] ${movie.title}`,
        run: async () => {
          const patch = await enrichTitle(movie.title, 'movie')
          applyMovie(movie, patch)
        },
      })
    }
    for (const show of data.sections[section].tvShows) {
      jobs.push({
        label: `tv [${section}] ${show.title}`,
        run: async () => {
          const patch = await enrichTitle(show.title, 'tv')
          applyTV(show, patch)
        },
      })
    }
  }

  for (const item of data.others) {
    const kind = otherKind(item.type)
    jobs.push({
      label: `other [${item.type}] ${item.title}`,
      run: async () => {
        const patch = await enrichTitle(item.title, kind)
        applyOther(item, patch)
      },
    })
  }

  const total = jobs.length
  console.log(`START total=${total}`)

  for (const job of jobs) {
    done += 1
    try {
      await job.run()
      log.push(`OK ${job.label}`)
      ok += 1
      console.log(`PROGRESS [${done}/${total}] OK ${job.label}`)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      log.push(`FAIL ${job.label}: ${reason}`)
      fail += 1
      console.log(`PROGRESS [${done}/${total}] FAIL ${job.label}: ${reason}`)
    }

    writeFileSync(DATA_PATH, `${JSON.stringify(data, null, 2)}\n`)
    writeFileSync(LOG_PATH, `${log.join('\n')}\n`)
    writeFileSync(resolve(ROOT, 'scripts/enrich-progress.txt'), `${done}/${total}\n`)
    await sleep(DELAY_MS)
  }

  console.log(`DONE ok=${ok} fail=${fail}`)
}

await main()
