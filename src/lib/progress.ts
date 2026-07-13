export function formatProgress(progress?: string): string | undefined {
  if (!progress?.trim()) return undefined

  const seasonEpisode = progress.match(/^S(\d+)E(\d+)$/i)
  if (seasonEpisode) {
    return `第${seasonEpisode[1]}季第${seasonEpisode[2]}集`
  }

  const fromSeason = progress.match(/^S(\d+)起$/i)
  if (fromSeason) {
    return `第${fromSeason[1]}季起`
  }

  const seasonsOnly = progress.match(/^S([\d、,，\s]+)$/i)
  if (seasonsOnly) {
    return `第${seasonsOnly[1].replace(/,/g, '、').replace(/，/g, '、')}季`
  }

  return progress
}

export function parseProgress(progress?: string): { season: string; episode: string } {
  if (!progress) return { season: '1', episode: '1' }

  const seasonEpisode = progress.match(/^S(\d+)E(\d+)$/i)
  if (seasonEpisode) {
    return { season: seasonEpisode[1], episode: seasonEpisode[2] }
  }

  const fromSeason = progress.match(/^S(\d+)起$/i)
  if (fromSeason) {
    return { season: fromSeason[1], episode: '1' }
  }

  const seasonOnly = progress.match(/^第(\d+)季$/)
  if (seasonOnly) {
    return { season: seasonOnly[1], episode: '1' }
  }

  return { season: '1', episode: '1' }
}

export function buildProgress(season: string, episode: string): string {
  const s = season.trim()
  const e = episode.trim()
  if (!s) return ''
  if (!e) return `第${s}季`
  return `S${s}E${e}`
}
