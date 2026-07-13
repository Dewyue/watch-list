import { useMemo } from 'react'
import GroupedAccordion from '../components/GroupedAccordion'
import { getOthers } from '../data/loadWatchlist'
import type { OtherItem } from '../types'
import { getOtherGroups } from '../types'

function otherDetails(item: OtherItem) {
  return [
    { label: '简介', value: item.synopsis ?? '' },
    { label: '进度', value: item.progress ?? '' },
  ]
}

export default function OthersPage() {
  const items = getOthers()
  const groups = useMemo(() => getOtherGroups(items), [items])

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold">其他</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          动漫、漫画、纪录片等非真人实拍作品 · 共 {items.length} 项
        </p>
      </header>

      <GroupedAccordion groups={groups} getDetails={otherDetails} emptyText="暂无内容" />
    </div>
  )
}
