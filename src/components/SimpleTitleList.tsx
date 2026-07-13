type SimpleTitleListProps = {
  titles: string[]
  emptyText: string
}

export default function SimpleTitleList({ titles, emptyText }: SimpleTitleListProps) {
  if (titles.length === 0) {
    return (
      <p className="rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {emptyText}
      </p>
    )
  }

  return (
    <ul className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {titles.map((title, index) => (
        <li
          key={`${title}-${index}`}
          className="min-h-11 border-b border-slate-100 px-4 py-3 text-[15px] font-medium last:border-b-0 dark:border-slate-800"
        >
          {title}
        </li>
      ))}
    </ul>
  )
}
