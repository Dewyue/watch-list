import { useEffect, useRef, useState } from 'react'
import { useWatchlist } from '../context/WatchlistContext'
import {
  enrichAllWatchlist,
  shouldAutoEnrichAll,
  type BatchEnrichProgress,
} from '../lib/batchEnrich'
import { getTmdbApiKey } from '../lib/tmdb'

export default function BatchEnrichRunner() {
  const { data, replaceData } = useWatchlist()
  const [progress, setProgress] = useState<BatchEnrichProgress | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    if (!getTmdbApiKey()) return
    if (!shouldAutoEnrichAll()) return

    started.current = true
    void enrichAllWatchlist(data, replaceData, setProgress).catch((err) => {
      setProgress({
        total: 0,
        done: 0,
        current: '',
        failed: [{ title: '批量补全', reason: err instanceof Error ? err.message : '启动失败' }],
        running: false,
      })
    })
  }, [data, replaceData])

  if (!progress || (!progress.running && progress.done === 0 && progress.failed.length === 0)) {
    return null
  }

  const succeeded = progress.done - progress.failed.length
  const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0
  const topFailure = progress.failed[0]

  return (
    <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-[430px] px-4">
      <div className="rounded-2xl border border-indigo-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-indigo-900 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium text-indigo-700 dark:text-indigo-300">
            {progress.running ? 'TMDB 批量补全中…' : 'TMDB 批量补全完成'}
          </span>
          {progress.total > 0 && (
            <span className="text-slate-500">
              {progress.done}/{progress.total}
            </span>
          )}
        </div>
        {progress.total > 0 && (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        {progress.current && (
          <p className="mt-2 truncate text-xs text-slate-500">正在处理：{progress.current}</p>
        )}
        {!progress.running && progress.total > 0 && (
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            成功 {succeeded} 条
            {progress.failed.length > 0 ? `，失败 ${progress.failed.length} 条` : ''}
          </p>
        )}
        {!progress.running && topFailure && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            {topFailure.title}：{topFailure.reason}
          </p>
        )}
      </div>
    </div>
  )
}
