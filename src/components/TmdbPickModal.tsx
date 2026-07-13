import type { TmdbSearchHit } from '../lib/tmdb'

type TmdbPickModalProps = {
  open: boolean
  title: string
  hits: TmdbSearchHit[]
  loading?: boolean
  onPick: (hit: TmdbSearchHit) => void
  onClose: () => void
}

export default function TmdbPickModal({
  open,
  title,
  hits,
  loading,
  onPick,
  onClose,
}: TmdbPickModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[70vh] w-full max-w-[430px] overflow-y-auto rounded-2xl bg-white p-4 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">选择 TMDB 结果</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">为「{title}」补全详情</p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">加载中…</p>
        ) : (
          <div className="mt-3 space-y-2">
            {hits.map((hit) => (
              <button
                key={`${hit.kind}-${hit.id}`}
                type="button"
                onClick={() => onPick(hit)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-left dark:border-slate-700"
              >
                <div className="font-medium">
                  {hit.title}
                  {hit.year ? ` (${hit.year})` : ''}
                  <span className="ml-2 text-xs text-slate-400">
                    {hit.kind === 'movie' ? '电影' : '剧集'}
                  </span>
                </div>
                {hit.overview && (
                  <div className="mt-1 line-clamp-2 text-xs text-slate-500">{hit.overview}</div>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 min-h-11 w-full rounded-xl text-sm text-slate-500"
        >
          取消
        </button>
      </div>
    </div>
  )
}
