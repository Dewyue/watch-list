import { useState } from 'react'
import type { DetailLine } from '../lib/itemDetails'

export type SimpleListItem = {
  id: string
  kind: 'movie' | 'tv'
  title: string
  progress?: string
  details: DetailLine[]
}

type SimpleTitleListProps = {
  items: SimpleListItem[]
  emptyText: string
  actionLabel?: string
  onItemAction?: (item: SimpleListItem) => void
  onDelete?: (item: SimpleListItem) => void
}

function formatProgress(progress?: string) {
  if (!progress?.trim()) return undefined
  const seasonEpisode = progress.match(/^S(\d+)E(\d+)$/i)
  if (seasonEpisode) return `第${seasonEpisode[1]}季第${seasonEpisode[2]}集`
  const fromSeason = progress.match(/^S(\d+)起$/i)
  if (fromSeason) return `第${fromSeason[1]}季起`
  return progress
}

export default function SimpleTitleList({
  items,
  emptyText,
  actionLabel = '···',
  onItemAction,
  onDelete,
}: SimpleTitleListProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {emptyText}
      </p>
    )
  }

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const progressLabel = formatProgress(item.progress)
        const visibleDetails = item.details.filter((d) => d.value.trim())
        const hasDetails = visibleDetails.length > 0
        const pillAction = actionLabel !== '···'

        return (
          <li key={item.id} className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900">
            <div className="flex items-start">
              <button
                type="button"
                onClick={() => hasDetails && toggleItem(item.id)}
                className="min-w-0 flex-1 px-4 py-3 text-left"
              >
                <div className="font-medium">{item.title}</div>
                {progressLabel && (
                  <div className="mt-0.5 text-sm text-indigo-600 dark:text-indigo-400">{progressLabel}</div>
                )}
                {hasDetails && (
                  <div className="mt-1 text-xs text-slate-400">
                    {openItems.has(item.id) ? '收起详情' : '查看详情'}
                  </div>
                )}
              </button>
              {(onItemAction || onDelete) && (
                <div className={['flex shrink-0 items-start gap-1.5', pillAction ? 'mr-3 mt-2' : ''].join(' ')}>
                  {onItemAction && (
                    <button
                      type="button"
                      onClick={() => onItemAction(item)}
                      className={[
                        'text-slate-500 dark:text-slate-400',
                        pillAction
                          ? 'inline-flex min-h-9 items-center rounded-xl bg-slate-100 px-2.5 text-xs font-medium dark:bg-slate-800'
                          : 'min-h-11 min-w-11 text-lg',
                      ].join(' ')}
                      aria-label={pillAction ? actionLabel : `操作 ${item.title}`}
                    >
                      {actionLabel}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="inline-flex min-h-9 items-center rounded-xl bg-red-50 px-2.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400"
                      aria-label={`删除 ${item.title}`}
                    >
                      删除
                    </button>
                  )}
                </div>
              )}
            </div>
            {hasDetails && openItems.has(item.id) && (
              <div className="px-4 pb-4 pt-1">
                {visibleDetails.map((detail) => (
                  <div key={detail.label} className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {detail.label}
                    </span>
                    <p className="mt-0.5 leading-relaxed">{detail.value}</p>
                  </div>
                ))}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
