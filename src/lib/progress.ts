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
