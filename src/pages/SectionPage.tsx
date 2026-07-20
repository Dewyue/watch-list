import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddItemModal from '../components/AddItemModal'
import GroupToggle from '../components/GroupToggle'
import GroupedAccordion from '../components/GroupedAccordion'
import ItemActionSheet, { type ItemAction } from '../components/ItemActionSheet'
import ProgressEditor from '../components/ProgressEditor'
import SimpleTitleList, { type SimpleListItem } from '../components/SimpleTitleList'
import SubTabBar from '../components/SubTabBar'
import TmdbPickModal from '../components/TmdbPickModal'
import { getSectionEntries, useWatchlist } from '../context/WatchlistContext'
import { enrichItemFromTmdb } from '../lib/enrichItem'
import { buildMovieDetails, buildTVDetails } from '../lib/itemDetails'
import type { TmdbSearchHit } from '../lib/tmdb'
import type { MediaKind } from '../store/watchlistStore'
import type { Movie, SectionKey, TVGroupMode, TVShow } from '../types'
import { getMovieGroups, getTVGroups, SECTIONS, SIMPLE_SECTIONS } from '../types'

type SectionPageProps = {
  sectionKey: SectionKey
}

type ActiveItem = {
  id: string
  kind: MediaKind
  title: string
  progress?: string
}

export default function SectionPage({ sectionKey }: SectionPageProps) {
  const { data, setProgress, moveTo, remove, addMovie, addTV, patchMovieItem, patchTVItem } =
    useWatchlist()
  const section = data.sections[sectionKey]
  const label = SECTIONS.find((s) => s.key === sectionKey)?.label ?? ''
  const isSimple = SIMPLE_SECTIONS.includes(sectionKey)

  const [activeItem, setActiveItem] = useState<ActiveItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [enrichHits, setEnrichHits] = useState<TmdbSearchHit[]>([])
  const [enrichPickOpen, setEnrichPickOpen] = useState(false)
  const [enrichLoading, setEnrichLoading] = useState(false)
  const [enrichError, setEnrichError] = useState('')

  const simpleItems: SimpleListItem[] = useMemo(
    () =>
      getSectionEntries(data, sectionKey).map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        progress: entry.progress,
        details:
          entry.kind === 'movie'
            ? buildMovieDetails(entry.raw as Movie)
            : buildTVDetails(entry.raw as TVShow),
      })),
    [data, sectionKey],
  )

  const [subTab, setSubTab] = useState<'movies' | 'tv'>('movies')
  const [tvGroupMode, setTvGroupMode] = useState<TVGroupMode>('country')

  const movieGroups = useMemo(() => getMovieGroups(section.movies), [section.movies])
  const tvGroups = useMemo(
    () => getTVGroups(section.tvShows, tvGroupMode),
    [section.tvShows, tvGroupMode],
  )

  const applyEnrich = (details: Record<string, unknown>, kind: MediaKind) => {
    if (!activeItem) return
    if (kind === 'movie') {
      patchMovieItem(sectionKey, activeItem.id, details as Partial<Movie>)
    } else {
      patchTVItem(sectionKey, activeItem.id, details as Partial<TVShow>)
    }
    setEnrichPickOpen(false)
    setEnrichHits([])
    setEnrichError('')
  }

  const runEnrich = async (pickId?: number, pickKind?: MediaKind) => {
    if (!activeItem) return

    setEnrichLoading(true)
    setEnrichError('')
    setSheetOpen(false)

    try {
      const kind = pickKind ?? activeItem.kind
      const result = await enrichItemFromTmdb(activeItem.title, kind, pickId)
      if ('needPick' in result) {
        setEnrichHits(result.hits)
        setEnrichPickOpen(true)
        return
      }
      applyEnrich(result.details as Record<string, unknown>, result.kind)
    } catch (err) {
      setEnrichError(err instanceof Error ? err.message : '补全失败')
      alert(err instanceof Error ? err.message : '补全失败')
    } finally {
      setEnrichLoading(false)
    }
  }

  const openActions = (item: ActiveItem) => {
    setActiveItem(item)
    setSheetOpen(true)
  }

  const handleAction = (action: ItemAction) => {
    if (!activeItem) return

    switch (action) {
      case 'editProgress':
        setSheetOpen(false)
        setEditorOpen(true)
        break
      case 'moveWatching':
        moveTo(sectionKey, 'watching', activeItem.id, activeItem.kind, activeItem.progress ?? 'S1E1')
        setSheetOpen(false)
        break
      case 'moveUrgent':
        moveTo(sectionKey, 'urgent', activeItem.id, activeItem.kind)
        setSheetOpen(false)
        break
      case 'enrichTmdb':
        void runEnrich()
        break
      case 'delete':
        if (confirm(`确定删除「${activeItem.title}」？`)) {
          remove(sectionKey, activeItem.id, activeItem.kind)
          setSheetOpen(false)
        }
        break
    }
  }

  const handleTodoAction = (item: Movie | TVShow, kind: MediaKind) => {
    openActions({
      id: item.id!,
      kind,
      title: item.title,
      progress: kind === 'tv' ? (item as TVShow).progress : undefined,
    })
  }

  return (
    <div>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">{label}</h1>
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

      {enrichError && (
        <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{enrichError}</p>
      )}

      {isSimple ? (
        <SimpleTitleList
          items={simpleItems}
          emptyText="暂无内容"
          actionLabel={sectionKey === 'watching' ? '修改进度' : '···'}
          onItemAction={(item) => {
            if (sectionKey === 'watching') {
              setActiveItem(item)
              setEditorOpen(true)
              return
            }
            openActions(item)
          }}
        />
      ) : (
        <>
          <SubTabBar
            active={subTab}
            onChange={setSubTab}
            movieCount={section.movies.length}
            tvCount={section.tvShows.length}
          />

          {subTab === 'movies' ? (
            <GroupedAccordion
              groups={movieGroups}
              getDetails={buildMovieDetails}
              emptyText="暂无电影"
              defaultCollapsed
              getItemId={(item) => item.id ?? item.title}
              onItemAction={(item) => handleTodoAction(item, 'movie')}
            />
          ) : (
            <>
              <GroupToggle active={tvGroupMode} onChange={setTvGroupMode} />
              <GroupedAccordion
                groups={tvGroups}
                getDetails={buildTVDetails}
                emptyText="暂无电视剧"
                defaultCollapsed
                getItemId={(item) => item.id ?? item.title}
                onItemAction={(item) => handleTodoAction(item, 'tv')}
              />
            </>
          )}
        </>
      )}

      <ItemActionSheet
        open={sheetOpen}
        title={activeItem?.title ?? ''}
        section={sectionKey}
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

      <ProgressEditor
        open={editorOpen}
        title={activeItem?.title ?? ''}
        progress={activeItem?.progress}
        onSave={(progress) => {
          if (!activeItem) return
          setProgress(sectionKey, activeItem.id, activeItem.kind, progress)
        }}
        onClose={() => setEditorOpen(false)}
      />

      <AddItemModal
        open={addOpen}
        target={{
          type: 'section',
          section: sectionKey,
          defaultKind: isSimple ? 'tv' : subTab === 'movies' ? 'movie' : 'tv',
        }}
        onClose={() => setAddOpen(false)}
        onAddMovie={addMovie}
        onAddTV={addTV}
        onAddOther={() => ''}
        onPatchMovie={patchMovieItem}
        onPatchTV={patchTVItem}
        onPatchOther={() => {}}
      />
    </div>
  )
}
