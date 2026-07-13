import { formatProgress } from '../lib/progress'

export type SimpleListItem = {
  title: string
  progress?: string
}

type SimpleTitleListProps = {
  items: SimpleListItem[]
  emptyText: string
}

export default function SimpleTitleList({ items, emptyText }: SimpleTitleListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {emptyText}
      </p>
    )
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {items.map((item, index) => {
        const progressLabel = formatProgress(item.progress)
        return (
          <li
            key={`${item.title}-${index}`}
            className="min-h-11 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
          >
            <div className="text-[15px] font-medium">{item.title}</div>
            {progressLabel && (
              <div className="mt-0.5 text-sm text-indigo-600 dark:text-indigo-400">{progressLabel}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
