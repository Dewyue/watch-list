import { NavLink } from 'react-router-dom'
import type { ReactElement } from 'react'
import { SECTIONS, type NavKey } from '../types'

type IconProps = {
  active: boolean
}

function WatchingIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {active ? (
        <path
          d="M8 5.5v13l11-6.5L8 5.5Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M9 7.5v9l7.5-4.5L9 7.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function UrgentIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {active ? (
        <path
          d="M13.2 2.5 5.8 13.2h5.3L10.8 21.5l7.4-10.7h-5.3L13.2 2.5Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M13 3 6.5 12.5H12L11 21l6.5-9.5H12L13 3Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function UnfinishedIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="12"
        r="8"
        stroke="currentColor"
        strokeWidth="1.7"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.18 : 0}
      />
      <path
        d="M12 8v4.2l2.4 1.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TodoIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {active ? (
        <path
          d="m12 3.2 2.45 5.16 5.65.62-4.24 3.9 1.2 5.55L12 15.7l-4.06 2.73 1.2-5.55-4.24-3.9 5.65-.62L12 3.2Z"
          fill="currentColor"
        />
      ) : (
        <path
          d="m12 4.2 2.1 4.42 4.85.53-3.64 3.35 1.03 4.76L12 15.1l-4.34 2.16 1.03-4.76-3.64-3.35 4.85-.53L12 4.2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function OthersIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      {[6, 12, 18].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy="12"
          r={active ? 2.2 : 1.8}
          fill="currentColor"
        />
      ))}
    </svg>
  )
}

const ICONS: Record<NavKey, (props: IconProps) => ReactElement> = {
  watching: WatchingIcon,
  urgent: UrgentIcon,
  unfinished: UnfinishedIcon,
  todo: TodoIcon,
  others: OthersIcon,
}

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 bg-white/90 backdrop-blur-xl dark:bg-slate-900/90">
      <div className="h-px bg-slate-200/70 dark:bg-slate-700/70" />
      <div className="flex px-1 pb-[env(safe-area-inset-bottom)]">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section.key]
          return (
            <NavLink
              key={section.path}
              to={section.path}
              className={({ isActive }) =>
                [
                  'flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors',
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  <span className="truncate leading-none">{section.label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
