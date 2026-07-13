import { useEffect, useState } from 'react'
import { buildProgress, parseProgress } from '../lib/progress'

type ProgressEditorProps = {
  open: boolean
  title: string
  progress?: string
  onSave: (progress: string) => void
  onClose: () => void
}

export default function ProgressEditor({ open, title, progress, onSave, onClose }: ProgressEditorProps) {
  const parsed = parseProgress(progress)
  const [season, setSeason] = useState(parsed.season)
  const [episode, setEpisode] = useState(parsed.episode)

  useEffect(() => {
    if (open) {
      const next = parseProgress(progress)
      setSeason(next.season)
      setEpisode(next.episode)
    }
  }, [open, progress])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4">
      <div className="w-full max-w-[430px] rounded-2xl bg-white p-4 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">修改进度</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{title}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">季</span>
            <input
              type="number"
              min={1}
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">集</span>
            <input
              type="number"
              min={1}
              value={episode}
              onChange={(e) => setEpisode(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
        </div>

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
            onClick={() => {
              onSave(buildProgress(season, episode))
              onClose()
            }}
            className="min-h-11 flex-1 rounded-xl bg-indigo-600 text-sm font-medium text-white"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
