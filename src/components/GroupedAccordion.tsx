import { useState } from 'react'
import MediaCard from './MediaCard'

type Detail = {
  label: string
  value: string
}[]

type GroupedAccordionProps<T extends { title: string; id?: string }> = {
  groups: Map<string, T[]>
  getDetails: (item: T) => Detail
  emptyText: string
  defaultCollapsed?: boolean
  getItemId?: (item: T, groupName: string, index: number) => string
  onItemAction?: (item: T) => void
}

export default function GroupedAccordion<T extends { title: string; id?: string }>({
  groups,
  getDetails,
  emptyText,
  defaultCollapsed = false,
  getItemId,
  onItemAction,
}: GroupedAccordionProps<T>) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => (defaultCollapsed ? new Set() : new Set(groups.keys())),
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  if (groups.size === 0) {
    return (
      <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        {emptyText}
      </p>
    )
  }

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
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
    <div className="space-y-3">
      {[...groups.entries()].map(([groupName, items]) => {
        const isOpen = openGroups.has(groupName)
        return (
          <section key={groupName} className="space-y-3">
            <button
              type="button"
              onClick={() => toggleGroup(groupName)}
              className="flex min-h-11 w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-left dark:bg-slate-900"
            >
              <span className="font-medium">{groupName}</span>
              <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                  {items.length}
                </span>
                <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const itemId = getItemId?.(item, groupName, index) ?? `${groupName}-${item.title}-${index}`
                  return (
                    <MediaCard
                      key={itemId}
                      title={item.title}
                      details={getDetails(item)}
                      isOpen={openItems.has(itemId)}
                      onToggle={() => toggleItem(itemId)}
                      onAction={onItemAction ? () => onItemAction(item) : undefined}
                    />
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
