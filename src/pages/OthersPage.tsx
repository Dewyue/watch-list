import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddItemModal from '../components/AddItemModal'
import GroupedAccordion from '../components/GroupedAccordion'
import ItemActionSheet, { type ItemAction } from '../components/ItemActionSheet'
import TmdbPickModal from '../components/TmdbPickModal'
import { useWatchlist } from '../context/WatchlistContext'
import { enrichItemFromTmdb, type EnrichDetails } from '../lib/enrichItem'
import { buildOtherDetails } from '../lib/itemDetails'
import {
  otherPatchFromMovie,
  otherPatchFromTV,
  type TmdbSearchHit,
} from '../lib/tmdb'
import type { MediaKind } from '../store/watchlistStore'
import type { OtherItem, OtherType } from '../types'
import { getOtherGroups } from '../types'

function otherSearchKind(type: OtherType): MediaKind {
  return type === 'documentary' || type === 'star' ? 'movie' : 'tv'
}

type ActiveOther = {
  id: string
  title: string
  type: OtherType
}

export default function OthersPage() {
  const { data, addOther, patchOther, removeOther } = useWatchlist()
  const items = data.others
  const groups = useMemo(() => getOtherGroups(items), [items])

  const [addOpen, setAddOpen] = useState(false)
  const [activeItem, setActiveItem] = useState<ActiveOther | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [enrichHits, setEnrichHits] = useState<TmdbSearchHit[]>([])
  const [enrichPickOpen, setEnrichPickOpen] = useState(false)
  const [enrichLoading, setEnrichLoading] = useState(false)

  const applyEnrich = (details: EnrichDetails, kind: MediaKind) => {
    if (!activeItem) return
    patchOther(
      activeItem.id,
      kind === 'movie'
        ? otherPatchFromMovie(details as Parameters<typeof otherPatchFromMovie>[0])
        : otherPatchFromTV(details as Parameters<typeof otherPatchFromTV>[0]),
    )
    setEnrichPickOpen(false)
    setEnrichHits([])
  }

  const runEnrich = async (pickId?: number, pickKind?: MediaKind) => {
    if (!activeItem) return

    setEnrichLoading(true)
    setSheetOpen(false)

    try {
      const kind = pickKind ?? otherSearchKind(activeItem.type)
      const result = await enrichItemFromTmdb(activeItem.title, kind, pickId)
      if ('needPick' in result) {
        setEnrichHits(result.hits)
        setEnrichPickOpen(true)
        return
      }
      applyEnrich(result.details, result.kind)
    } catch (err) {
      alert(err instanceof Error ? err.message : '补全失败')
    } finally {
      setEnrichLoading(false)
    }
  }

  const handleAction = (action: ItemAction) => {
    if (!activeItem) return

    switch (action) {
      case 'enrichTmdb':
        void runEnrich()
        break
      case 'delete':
        if (confirm(`确定删除「${activeItem.title}」？`)) {
          removeOther(activeItem.id)
          setSheetOpen(false)
        }
        break
    }
  }

  const openActions = (item: OtherItem) => {
    setActiveItem({
      id: item.id!,
      title: item.title,
      type: item.type,
    })
    setSheetOpen(true)
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">其他</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white"
          >
            添加
          </button>
          <Link
            to="/settings"
            className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 text-sm font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300"
          >
            数据
          </Link>
        </div>
      </header>

      <GroupedAccordion
        groups={groups}
        getDetails={buildOtherDetails}
        emptyText="暂无内容"
        defaultCollapsed
        getItemId={(item) => item.id ?? item.title}
        onItemAction={openActions}
      />

      <ItemActionSheet
        open={sheetOpen}
        title={activeItem?.title ?? ''}
        section="others"
        onAction={handleAction}
        onClose={() => setSheetOpen(false)}
      />

      <TmdbPickModal
        open={enrichPickOpen}
        title={activeItem?.title ?? ''}
        hits={enrichHits}
        loading={enrichLoading}
        onPick={(hit) => void runEnrich(hit.id, hit.kind)}
        onClose={() => {
          setEnrichPickOpen(false)
          setEnrichHits([])
        }}
      />

      <AddItemModal
        open={addOpen}
        target={{ type: 'others' }}
        onClose={() => setAddOpen(false)}
        onAddMovie={() => ''}
        onAddTV={() => ''}
        onAddOther={addOther}
        onPatchMovie={() => {}}
        onPatchTV={() => {}}
        onPatchOther={patchOther}
      />
    </div>
  )
}
