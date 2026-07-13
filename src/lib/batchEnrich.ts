import { enrichItemFromTmdb, type EnrichDetails } from './enrichItem'
import { otherPatchFromMovie, otherPatchFromTV } from './tmdb'
import type { MediaKind } from '../store/watchlistStore'
import type { Movie, OtherItem, OtherType, SectionKey, TVShow, WatchlistData } from '../types'

const ENRICH_VERSION = '2026-07-13-all'
const ENRICH_VERSION_KEY = 'watch-list-enrich-version'
const DELAY_MS = 280

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
      jobs.push({
        section,
        id: movie.id,
        title: movie.title,
        kind: 'movie',
      })
    }
    for (const show of data.sections[section].tvShows) {
      if (!show.id) continue
      jobs.push({
        section,
        id: show.id,
        title: show.title,
        kind: 'tv',
      })
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

type PatchHandlers = {
  patchMovie: (section: SectionKey, id: string, patch: Partial<Movie>) => void
  patchTV: (section: SectionKey, id: string, patch: Partial<TVShow>) => void
  patchOther: (id: string, patch: Partial<OtherItem>) => void
}

async function enrichJob(job: BatchEnrichJob, handlers: PatchHandlers) {
  const result = await enrichItemFromTmdb(job.title, job.kind)
  if ('needPick' in result) {
    const hit = result.hits[0]
    if (!hit) throw new Error('未找到匹配结果')
    const picked = await enrichItemFromTmdb(job.title, hit.kind, hit.id)
    if ('needPick' in picked) throw new Error('补全失败')
    applyPatch(job, picked.details, picked.kind, handlers)
    return
  }
  applyPatch(job, result.details, result.kind, handlers)
}

function applyPatch(
  job: BatchEnrichJob,
  details: EnrichDetails,
  kind: MediaKind,
  handlers: PatchHandlers,
) {
  if (job.section === 'others') {
    handlers.patchOther(
      job.id,
      kind === 'movie'
        ? otherPatchFromMovie(details as Parameters<typeof otherPatchFromMovie>[0])
        : otherPatchFromTV(details as Parameters<typeof otherPatchFromTV>[0]),
    )
    return
  }

  if (kind === 'movie') {
    handlers.patchMovie(job.section, job.id, details as Partial<Movie>)
  } else {
    handlers.patchTV(job.section, job.id, details as Partial<TVShow>)
  }
}

export async function enrichAllWatchlist(
  data: WatchlistData,
  handlers: PatchHandlers,
  onProgress: (progress: BatchEnrichProgress) => void,
): Promise<BatchEnrichProgress> {
  const jobs = listEnrichJobs(data)
  const progress: BatchEnrichProgress = {
    total: jobs.length,
    done: 0,
    current: '',
    failed: [],
    running: true,
  }
  onProgress({ ...progress })

  for (const job of jobs) {
    progress.current = job.title
    onProgress({ ...progress })

    try {
      await enrichJob(job, handlers)
    } catch (err) {
      progress.failed.push({
        title: job.title,
        reason: err instanceof Error ? err.message : '补全失败',
      })
    }

    progress.done += 1
    onProgress({ ...progress })
    await delay(DELAY_MS)
  }

  progress.running = false
  progress.current = ''
  onProgress({ ...progress })
  markAutoEnrichDone()
  return progress
}
