import type { TVGroupMode } from '../types'
import { TV_GROUP_MODES } from '../types'

type GroupToggleProps = {
  active: TVGroupMode
  onChange: (mode: TVGroupMode) => void
}

export default function GroupToggle({ active, onChange }: GroupToggleProps) {
  return (
    <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {TV_GROUP_MODES.map((mode) => (
        <button
          key={mode.key}
          type="button"
          onClick={() => onChange(mode.key)}
          className={[
            'min-h-11 flex-1 rounded-lg text-xs font-medium transition',
            active === mode.key
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          ].join(' ')}
        >
          {mode.label}
        </button>
      ))}
    </div>
  )
}
