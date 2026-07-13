import { useEffect, useState } from 'react'
import {
  enrichMovie,
  enrichTV,
  getTmdbApiKey,
  movieFromHit,
  searchTmdb,
  tvFromHit,
  type TmdbSearchHit,
} from '../lib/tmdb'
import type { MediaKind } from '../store/watchlistStore'
import type { Movie, OtherItem, OtherType, SectionKey, TVShow } from '../types'
import { OTHER_TYPE_LABELS } from '../types'

export type AddTarget =
  | { type: 'section'; section: SectionKey; defaultKind?: MediaKind }
  | { type: 'others' }

type AddItemModalProps = {
  open: boolean
  target: AddTarget
  onClose: () => void
  onAddMovie: (section: SectionKey, movie: Movie) => string
  onAddTV: (section: SectionKey, show: TVShow) => string
  onAddOther: (item: OtherItem) => string
  onPatchMovie: (section: SectionKey, id: string, patch: Partial<Movie>) => void
  onPatchTV: (section: SectionKey, id: string, patch: Partial<TVShow>) => void
  onPatchOther: (id: string, patch: Partial<OtherItem>) => void
}

const OTHER_TYPES: OtherType[] = ['anime', 'manga', 'documentary', 'star', 'other']

export default function AddItemModal({
  open,
  target,
  onClose,
  onAddMovie,
  onAddTV,
  onAddOther,
  onPatchMovie,
  onPatchTV,
  onPatchOther,
}: AddItemModalProps) {
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<MediaKind>('tv')
  const [otherType, setOtherType] = useState<OtherType>('anime')
  const [actor, setActor] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hits, setHits] = useState<TmdbSearchHit[]>([])

  useEffect(() => {
    if (open) {
      setTitle('')
      setError('')
      setHits([])
      setActor('')
      if (target.type === 'section') {
        setKind(target.defaultKind ?? (target.section === 'todo' ? 'movie' : 'tv'))
      }
    }
  }, [open, target])

  if (!open) return null

  const searchKind: MediaKind =
    target.type === 'others' ? (otherType === 'documentary' ? 'movie' : 'tv') : kind

  const enrichInBackground = (hit: TmdbSearchHit, itemId: string) => {
    const apiKey = getTmdbApiKey()
    if (!apiKey) return

    const enrich =
      hit.kind === 'movie'
        ? enrichMovie(hit.id, apiKey)
        : enrichTV(hit.id, apiKey)

    enrich
      .then((details) => {
        if (target.type === 'others') {
          onPatchOther(itemId, {
            title: details.title,
            synopsis: details.synopsis,
          })
          return
        }

        if (hit.kind === 'movie') {
          onPatchMovie(target.section, itemId, details)
        } else {
          onPatchTV(target.section, itemId, details)
        }
      })
      .catch(() => {
        // 保留搜索阶段已添加的基础信息
      })
  }

  const fastAddFromHit = (hit: TmdbSearchHit) => {
    const id = crypto.randomUUID()

    if (target.type === 'others') {
      const itemId = onAddOther({
        id,
        title: hit.title,
        type: otherType,
        actor: otherType === 'star' ? actor.trim() : undefined,
        synopsis: hit.overview || undefined,
      })
      enrichInBackground(hit, itemId)
    } else if (searchKind === 'movie') {
      const itemId = onAddMovie(target.section, { id, ...movieFromHit(hit) })
      enrichInBackground(hit, itemId)
    } else {
      const itemId = onAddTV(target.section, { id, ...tvFromHit(hit) })
      enrichInBackground(hit, itemId)
    }

    onClose()
  }

  const addBasicOnly = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请输入名称')
      return
    }

    if (target.type === 'others') {
      if (otherType === 'star' && !actor.trim()) {
        setError('演员作品请填写演员名')
        return
      }
      onAddOther({
        title: trimmed,
        type: otherType,
        actor: otherType === 'star' ? actor.trim() : undefined,
      })
    } else if (kind === 'movie') {
      onAddMovie(target.section, { title: trimmed, genre: '未分类' })
    } else {
      onAddTV(target.section, { title: trimmed, country: '未分类', genre: '未分类' })
    }
    onClose()
  }

  const runSearch = async (trimmed: string) => {
    const apiKey = getTmdbApiKey()
    if (!apiKey) {
      setError('请先在「数据」页配置 TMDB API Key')
      return
    }

    setLoading(true)
    setError('')
    setHits([])

    try {
      const results = await searchTmdb(trimmed, searchKind, apiKey)
      if (results.length === 0) {
        setError('未找到匹配结果，可改试英文名或仅添加名称')
        return
      }
      if (results.length === 1) {
        fastAddFromHit(results[0])
        return
      }
      setHits(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败，可改试英文名或仅添加名称')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed) {
      setError('请输入名称')
      return
    }

    if (target.type === 'others' && otherType === 'star' && !actor.trim()) {
      setError('演员作品请填写演员名')
      return
    }

    void runSearch(trimmed)
  }

  const handlePick = (hit: TmdbSearchHit) => {
    fastAddFromHit(hit)
    setHits([])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-[430px] overflow-y-auto rounded-2xl bg-white p-4 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">添加条目</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          先快速添加，详情在后台自动补全（已缓存加速）
        </p>

        {target.type === 'section' ? (
          <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['movie', 'tv'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={[
                  'min-h-10 flex-1 rounded-lg text-sm font-medium',
                  kind === value
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
                    : 'text-slate-500',
                ].join(' ')}
              >
                {value === 'movie' ? '电影' : '电视剧'}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <label className="mb-1 block text-xs text-slate-500">类型</label>
            <select
              value={otherType}
              onChange={(e) => setOtherType(e.target.value as OtherType)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
            >
              {OTHER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {OTHER_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        )}

        {target.type === 'others' && otherType === 'star' && (
          <label className="mt-3 block">
            <span className="mb-1 block text-xs text-slate-500">演员名</span>
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="如：王力宏"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        )}

        <label className="mt-3 block">
          <span className="mb-1 block text-xs text-slate-500">名称</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入片名/剧名，支持中英文"
            className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-800"
          />
        </label>

        {error && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{error}</p>}

        {hits.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-slate-500">找到多个结果，点选后立即添加：</p>
            {hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                type="button"
                onClick={() => handlePick(hit)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left dark:border-slate-700"
              >
                <div className="font-medium">
                  {hit.title}
                  {hit.year ? ` (${hit.year})` : ''}
                </div>
                {hit.overview && (
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{hit.overview}</div>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 flex-1 rounded-xl border border-slate-200 text-sm dark:border-slate-700"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="min-h-11 flex-1 rounded-xl bg-indigo-600 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? '搜索中…' : '搜索并添加'}
          </button>
        </div>

        <button
          type="button"
          onClick={addBasicOnly}
          className="mt-2 min-h-11 w-full rounded-xl text-sm text-slate-500"
        >
          仅添加名称（不联网）
        </button>
      </div>
    </div>
  )
}
