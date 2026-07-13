import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import GroupedAccordion from '../components/GroupedAccordion'
import { useWatchlist } from '../context/WatchlistContext'
import type { OtherItem } from '../types'
import { getOtherGroups } from '../types'

function otherDetails(item: OtherItem) {
  return [
    { label: '简介', value: item.synopsis ?? '' },
    { label: '进度', value: item.progress ?? '' },
  ]
}

export default function OthersPage() {
  const { data } = useWatchlist()
  const items = data.others
  const groups = useMemo(() => getOtherGroups(items), [items])

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">其他</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            动漫、漫画、纪录片、演员作品等 · 共 {items.length} 项
          </p>
        </div>
        <Link
          to="/settings"
          className="min-h-11 shrink-0 rounded-xl px-3 text-sm text-slate-500 dark:text-slate-400"
        >
          数据
        </Link>
      </header>

      <GroupedAccordion
        groups={groups}
        getDetails={otherDetails}
        emptyText="暂无内容"
        defaultCollapsed
        getItemId={(item) => item.id ?? item.title}
      />
    </div>
  )
}
