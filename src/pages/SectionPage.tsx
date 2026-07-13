import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AddItemModal from '../components/AddItemModal'
import GroupToggle from '../components/GroupToggle'
import GroupedAccordion from '../components/GroupedAccordion'
import ItemActionSheet, { type ItemAction } from '../components/ItemActionSheet'
import ProgressEditor from '../components/ProgressEditor'
import SimpleTitleList, { type SimpleListItem } from '../components/SimpleTitleList'
import SubTabBar from '../components/SubTabBar'
import { getSectionEntries, useWatchlist } from '../context/WatchlistContext'
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

function movieDetails(movie: Movie) {
  return [
    { label: '简介', value: movie.synopsis ?? '' },
    { label: '时长', value: movie.duration ?? '' },
    { label: '主演', value: movie.actors?.join('、') ?? '' },
    { label: '导演', value: movie.director ?? '' },
  ]
}

function tvDetails(show: TVShow) {
  const seasonEp =
    show.seasons != null || show.episodes != null
      ? `${show.seasons ?? '?'} 季 · ${show.episodes ?? '?'} 集`
      : ''

  return [
    { label: '简介', value: show.synopsis ?? '' },
    { label: '进度', value: show.progress ?? '' },
    { label: '季数/集数', value: seasonEp },
    { label: '国家', value: show.country ?? '' },
    { label: '类别', value: show.genre ?? '' },
    { label: '平台', value: show.platform ?? '' },
  ]
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

  const simpleItems: SimpleListItem[] = useMemo(
    () =>
      getSectionEntries(data, sectionKey).map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        title: entry.title,
        progress: entry.progress,
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

  const openActions = (item: ActiveItem) => {
    setActiveItem(item)
    setSheetOpen(true)
  }

  const handleAction = (action: ItemAction) => {
    if (!activeItem) return

    switch (action) {
      case 'editProgress':
        setEditorOpen(true)
        break
      case 'moveWatching':
        moveTo(sectionKey, 'watching', activeItem.id, activeItem.kind, activeItem.progress ?? 'S1E1')
        break
      case 'moveUrgent':
        moveTo(sectionKey, 'urgent', activeItem.id, activeItem.kind)
        break
      case 'delete':
        if (confirm(`确定删除「${activeItem.title}」？`)) {
          remove(sectionKey, activeItem.id, activeItem.kind)
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
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">{label}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isSimple
              ? `共 ${simpleItems.length} 项 · 点 ··· 管理`
              : `电影 ${section.movies.length} 部 · 电视剧 ${section.tvShows.length} 部 · 点 ··· 管理`}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="min-h-11 rounded-xl bg-indigo-600 px-3 text-sm font-medium text-white"
          >
            添加
          </button>
          <Link
            to="/settings"
            className="min-h-11 rounded-xl px-3 text-sm text-slate-500 dark:text-slate-400"
          >
            数据
          </Link>
        </div>
      </header>

      {isSimple ? (
        <SimpleTitleList
          items={simpleItems}
          emptyText="暂无内容"
          onItemAction={(item) => openActions(item)}
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
              getDetails={movieDetails}
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
                getDetails={tvDetails}
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
