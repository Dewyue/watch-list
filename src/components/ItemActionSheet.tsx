import type { SectionKey } from '../types'

export type ItemAction =
  | 'editProgress'
  | 'moveWatching'
  | 'moveUrgent'
  | 'enrichTmdb'
  | 'delete'

type ItemActionSheetProps = {
  open: boolean
  title: string
  section: SectionKey | 'others'
  onAction: (action: ItemAction) => void
  onClose: () => void
}

function getActions(section: SectionKey | 'others'): {
  action: ItemAction
  label: string
  tone?: 'danger'
}[] {
  const enrich = { action: 'enrichTmdb' as const, label: '从 TMDB 补全详情' }

  switch (section) {
    case 'watching':
      return [
        { action: 'editProgress', label: '修改进度' },
        { action: 'delete', label: '删除', tone: 'danger' },
      ]
    case 'urgent':
      return [
        { action: 'moveWatching', label: '移到正在看' },
        enrich,
        { action: 'delete', label: '删除', tone: 'danger' },
      ]
    case 'unfinished':
      return [
        { action: 'moveWatching', label: '移到正在看' },
        enrich,
        { action: 'delete', label: '删除', tone: 'danger' },
      ]
    case 'todo':
      return [
        { action: 'moveWatching', label: '移到正在看' },
        { action: 'moveUrgent', label: '移到抓紧看' },
        enrich,
        { action: 'delete', label: '删除', tone: 'danger' },
      ]
    case 'others':
      return [enrich, { action: 'delete', label: '删除', tone: 'danger' }]
    default:
      return []
  }
}

export default function ItemActionSheet({
  open,
  title,
  section,
  onAction,
  onClose,
}: ItemActionSheetProps) {
  if (!open) return null

  const actions = getActions(section)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-[430px] rounded-2xl bg-white p-2 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        {actions.map((item) => (
          <button
            key={item.action}
            type="button"
            onClick={() => {
              onAction(item.action)
              if (item.action !== 'enrichTmdb') onClose()
            }}
            className={[
              'min-h-11 w-full rounded-xl px-3 text-left text-[15px]',
              item.tone === 'danger'
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-800 dark:text-slate-100',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClose}
          className="mt-1 min-h-11 w-full rounded-xl px-3 text-left text-[15px] text-slate-500"
        >
          取消
        </button>
      </div>
    </div>
  )
}
