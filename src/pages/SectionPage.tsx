import { useMemo, useState } from 'react'
import GroupToggle from '../components/GroupToggle'
import GroupedAccordion from '../components/GroupedAccordion'
import SimpleTitleList from '../components/SimpleTitleList'
import SubTabBar from '../components/SubTabBar'
import { getSection } from '../data/loadWatchlist'
import type { Movie, SectionKey, TVGroupMode, TVShow } from '../types'
import { getMovieGroups, getTVGroups, SECTIONS, SIMPLE_SECTIONS } from '../types'

type SectionPageProps = {
  sectionKey: SectionKey
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
  const section = getSection(sectionKey)
  const label = SECTIONS.find((s) => s.key === sectionKey)?.label ?? ''
  const isSimple = SIMPLE_SECTIONS.includes(sectionKey)

  const simpleItems = useMemo(
    () =>
      [...section.tvShows, ...section.movies].map((item) => ({
        title: item.title,
        progress: 'progress' in item ? item.progress : undefined,
      })),
    [section.movies, section.tvShows],
  )

  const [subTab, setSubTab] = useState<'movies' | 'tv'>('movies')
  const [tvGroupMode, setTvGroupMode] = useState<TVGroupMode>('country')

  const movieGroups = useMemo(() => getMovieGroups(section.movies), [section.movies])
  const tvGroups = useMemo(
    () => getTVGroups(section.tvShows, tvGroupMode),
    [section.tvShows, tvGroupMode],
  )

  if (isSimple) {
    return (
      <div>
        <header className="mb-4">
          <h1 className="text-xl font-bold">{label}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">共 {simpleItems.length} 项</p>
        </header>

        <SimpleTitleList items={simpleItems} emptyText="暂无内容" />
      </div>
    )
  }

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold">{label}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          电影 {section.movies.length} 部 · 电视剧 {section.tvShows.length} 部
        </p>
      </header>

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
        />
      ) : (
        <>
          <GroupToggle active={tvGroupMode} onChange={setTvGroupMode} />
          <GroupedAccordion
            groups={tvGroups}
            getDetails={tvDetails}
            emptyText="暂无电视剧"
            defaultCollapsed
          />
        </>
      )}
    </div>
  )
}
