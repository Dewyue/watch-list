import { NavLink } from 'react-router-dom'
import { SECTIONS } from '../types'

const ICONS: Record<string, string> = {
  watching: '▶',
  urgent: '⚡',
  unfinished: '◐',
  todo: '☆',
  others: '◎',
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex px-1 pb-[env(safe-area-inset-bottom)]">
        {SECTIONS.map((section) => (
          <NavLink
            key={section.path}
            to={section.path}
            className={({ isActive }) =>
              [
                'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition',
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              ].join(' ')
            }
          >
            <span className="text-base leading-none">{ICONS[section.key]}</span>
            <span className="truncate">{section.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
