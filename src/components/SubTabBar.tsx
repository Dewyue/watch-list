type SubTabBarProps = {
  active: 'movies' | 'tv'
  onChange: (tab: 'movies' | 'tv') => void
  movieCount: number
  tvCount: number
}

export default function SubTabBar({ active, onChange, movieCount, tvCount }: SubTabBarProps) {
  const tabs = [
    { key: 'movies' as const, label: '电影', count: movieCount },
    { key: 'tv' as const, label: '电视剧', count: tvCount },
  ]

  return (
    <div className="mb-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={[
            'min-h-11 flex-1 rounded-lg text-sm font-medium transition',
            active === tab.key
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          ].join(' ')}
        >
          {tab.label}
          <span className="ml-1 text-xs opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  )
}
