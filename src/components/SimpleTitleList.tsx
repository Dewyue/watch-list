import { formatProgress } from '../lib/progress'

export type SimpleListItem = {
  id: string
  kind: 'movie' | 'tv'
  title: string
  progress?: string
}

type SimpleTitleListProps = {
  items: SimpleListItem[]
  emptyText: string
  onItemAction?: (item: SimpleListItem) => void
}

export default function SimpleTitleList({ items, emptyText, onItemAction }: SimpleTitleListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {emptyText}
      </p>
    )
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {items.map((item) => {
        const progressLabel = formatProgress(item.progress)
        return (
          <li
            key={item.id}
            className="flex min-h-11 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium">{item.title}</div>
              {progressLabel && (
                <div className="mt-0.5 text-sm text-indigo-600 dark:text-indigo-400">{progressLabel}</div>
              )}
            </div>
            {onItemAction && (
              <button
                type="button"
                onClick={() => onItemAction(item)}
                className="min-h-11 min-w-11 shrink-0 rounded-full text-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={`操作 ${item.title}`}
              >
                ···
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
