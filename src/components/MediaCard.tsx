type MediaCardProps = {
  title: string
  details: { label: string; value: string }[]
  isOpen: boolean
  onToggle: () => void
}

export default function MediaCard({ title, details, isOpen, onToggle }: MediaCardProps) {
  const visibleDetails = details.filter((d) => d.value.trim())

  return (
    <div className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[15px] font-medium">{title}</span>
        {visibleDetails.length > 0 && (
          <span className="ml-2 shrink-0 text-xs text-slate-400">{isOpen ? '收起' : '详情'}</span>
        )}
      </button>

      {isOpen && visibleDetails.length > 0 && (
        <div className="space-y-2 px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">
          {visibleDetails.map((detail) => (
            <div key={detail.label}>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {detail.label}
              </span>
              <p className="mt-0.5 leading-relaxed">{detail.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
