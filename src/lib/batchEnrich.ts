import { enrichItemFromTmdb, type EnrichDetails } from './enrichItem'
import { otherPatchFromMovie, otherPatchFromTV } from './tmdb'
import {
  patchMovieInData,
  patchOtherInData,
  patchTVInData,
} from './watchlistData'
import type { MediaKind } from '../store/watchlistStore'
import type { Movie, OtherType, SectionKey, TVShow, WatchlistData } from '../types'

const ENRICH_VERSION = '2026-07-13-v3'
const ENRICH_VERSION_KEY = 'watch-list-enrich-version'
const ENRICH_LOCK_KEY = 'watch-list-enrich-lock'
const DELAY_MS = 320
const SAVE_EVERY = 5

export type BatchEnrichJob = {
  section: SectionKey | 'others'
  id: string
  title: string
  kind: MediaKind
  otherType?: OtherType
}

export type BatchEnrichProgress = {
  total: number
  done: number
  current: string
  failed: { title: string; reason: string }[]
  running: boolean
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function otherSearchKind(type: OtherType): MediaKind {
  return type === 'documentary' || type === 'star' ? 'movie' : 'tv'
}

export function listEnrichJobs(data: WatchlistData): BatchEnrichJob[] {
  const jobs: BatchEnrichJob[] = []

  for (const section of Object.keys(data.sections) as SectionKey[]) {
    for (const movie of data.sections[section].movies) {
      if (!movie.id) continue
      jobs.push({ section, id: movie.id, title: movie.title, kind: 'movie' })
    }
    for (const show of data.sections[section].tvShows) {
      if (!show.id) continue
      jobs.push({ section, id: show.id, title: show.title, kind: 'tv' })
    }
  }

  for (const item of data.others) {
    if (!item.id) continue
    jobs.push({
      section: 'others',
      id: item.id,
      title: item.title,
      kind: otherSearchKind(item.type),
      otherType: item.type,
    })
  }

  return jobs
}

export function shouldAutoEnrichAll(): boolean {
  return localStorage.getItem(ENRICH_VERSION_KEY) !== ENRICH_VERSION
}

export function markAutoEnrichDone() {
  localStorage.setItem(ENRICH_VERSION_KEY, ENRICH_VERSION)
}

export function resetAutoEnrichFlag() {
  localStorage.removeItem(ENRICH_VERSION_KEY)
}

export function acquireEnrichLock(): boolean {
  const existing = sessionStorage.getItem(ENRICH_LOCK_KEY)
  if (existing) {
    const age = Date.now() - Number(existing)
    if (Number.isFinite(age) && age < 30 * 60 * 1000) return false
    sessionStorage.removeItem(ENRICH_LOCK_KEY)
  }
  sessionStorage.setItem(ENRICH_LOCK_KEY, String(Date.now()))
  return true
}

export function releaseEnrichLock() {
  sessionStorage.removeItem(ENRICH_LOCK_KEY)
}

function applyPatchInMemory(
  data: WatchlistData,
  job: BatchEnrichJob,
  details: EnrichDetails,
  kind: MediaKind,
) {
  if (job.section === 'others') {
    patchOtherInData(
      data,
      job.id,
      kind === 'movie'
        ? otherPatchFromMovie(details as Parameters<typeof otherPatchFromMovie>[0])
        : otherPatchFromTV(details as Parameters<typeof otherPatchFromTV>[0]),
    )
    return
  }

  if (kind === 'movie') {
    patchMovieInData(data, job.section, job.id, details as Partial<Movie>)
  } else {
    patchTVInData(data, job.section, job.id, details as Partial<TVShow>)
  }
}

async function enrichJob(job: BatchEnrichJob) {
  const result = await enrichItemFromTmdb(job.title, job.kind)
  if ('needPick' in result) {
    const hit = result.hits[0]
    if (!hit) throw new Error('未找到匹配结果')
    const picked = await enrichItemFromTmdb(job.title, hit.kind, hit.id)
    if ('needPick' in picked) throw new Error('补全失败')
    return { details: picked.details, kind: picked.kind }
  }
  return { details: result.details, kind: result.kind }
}

export async function enrichAllWatchlist(
  initialData: WatchlistData,
  onSave: (data: WatchlistData) => void,
  onProgress: (progress: BatchEnrichProgress) => void,
): Promise<BatchEnrichProgress> {
  if (!acquireEnrichLock()) {
    throw new Error('已有补全任务在运行，请稍后再试')
  }

  const data = structuredClone(initialData)
  const jobs = listEnrichJobs(data)
  const progress: BatchEnrichProgress = {
    total: jobs.length,
    done: 0,
    current: '',
    failed: [],
    running: true,
  }
  onProgress({ ...progress })

  try {
    for (const job of jobs) {
      progress.current = job.title
      onProgress({ ...progress })

      try {
        const { details, kind } = await enrichJob(job)
        applyPatchInMemory(data, job, details, kind)
      } catch (err) {
        progress.failed.push({
          title: job.title,
          reason: err instanceof Error ? err.message : '补全失败',
        })
      }

      progress.done += 1
      onProgress({ ...progress })

      if (progress.done % SAVE_EVERY === 0 || progress.done === progress.total) {
        onSave(structuredClone(data))
      }

      await delay(DELAY_MS)
    }
  } finally {
    releaseEnrichLock()
  }

  progress.running = false
  progress.current = ''
  onProgress({ ...progress })

  const succeeded = progress.total - progress.failed.length
  if (succeeded > 0) {
    markAutoEnrichDone()
  }

  return progress
}
