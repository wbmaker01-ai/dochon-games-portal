// Hybrid Popularity & Trending Ranking Algorithm for Dochon Games Portal
// Combines:
// 1. [Activity-driven Heat]: Realtime DB Leaderboard registration count & competitive intensity
// 2. [New Release Boost]: Newly released games get a strategic initial boost
// 3. [User Engagement]: Local play counts & favorite status

export const GAME_RELEASE_METADATA = {
  colortile: { releaseOrder: 8, icon: '🧩', isNew: true },
  gnome: { releaseOrder: 7, icon: '🌿', isNew: true },
  baseball: { releaseOrder: 6, icon: '⚾', isNew: false },
  minesweeper: { releaseOrder: 5, icon: '💣', isNew: false },
  solitaire: { releaseOrder: 4, icon: '🃏', isNew: false },
  snake: { releaseOrder: 3, icon: '🐍', isNew: false },
  dino: { releaseOrder: 2, icon: '🦖', isNew: false },
  pacman: { releaseOrder: 1, icon: '🟡', isNew: false },
};

/**
 * Calculates the hybrid popularity score for a single game.
 *
 * @param {Object} params
 * @param {string} params.gameId
 * @param {number} params.leaderboardCount - Number of leaderboard entries in DB
 * @param {Object|null} params.topScore - Champion info { score, name }
 * @param {number} params.localPlayCount - Number of times played locally
 * @param {boolean} params.isFavorite - Whether game is favorited
 * @returns {number} calculated popularity score
 */
export function calculateGamePopularityScore({
  gameId,
  leaderboardCount = 0,
  topScore = null,
  localPlayCount = 0,
  isFavorite = false,
}) {
  const meta = GAME_RELEASE_METADATA[gameId] || { releaseOrder: 1, icon: '🎮', isNew: false };

  // 1. [Activity-driven Heat] Leaderboard score count (weight: 6 pts each)
  // Plus score intensity (logarithmic bonus for high competition)
  const activityPoints = leaderboardCount * 6;
  const scoreIntensityPoints = topScore?.score > 100
    ? Math.min(20, Math.round(Math.log10(topScore.score) * 5))
    : 0;

  // 2. [New Release Boost] Linear weight from newest to oldest
  const newReleaseBoost = meta.releaseOrder * 5.5;

  // 3. [User Engagement] Local plays + Favorites
  const engagementPoints = (localPlayCount * 1.5) + (isFavorite ? 6 : 0);

  return Math.round((activityPoints + scoreIntensityPoints + newReleaseBoost + engagementPoints) * 10) / 10;
}

/**
 * Generates an intuitive, dynamic badge for the ranked game
 *
 * @param {number} rank - 1-based rank position
 * @param {string} gameId
 * @returns {string} badge text (e.g. '🔥 핫인기 1위', '⚡ 핫배틀 2위', '✨ NEW 3위')
 */
export function getDynamicRankBadge(rank, gameId) {
  const meta = GAME_RELEASE_METADATA[gameId] || { icon: '🎮', isNew: false };
  const icon = meta.icon || '🎮';

  if (rank === 1) {
    return meta.isNew ? '🔥 핫인기 1위' : '👑 인기 1위';
  }
  if (rank === 2) {
    return meta.isNew ? '⚡ 급상승 2위' : '⚡ 핫배틀 2위';
  }
  if (rank === 3) {
    return meta.isNew ? '✨ NEW 3위' : `${icon} 인기 3위`;
  }
  if (meta.isNew) {
    return `✨ NEW ${rank}위`;
  }
  return `${icon} ${rank}위`;
}

/**
 * Takes playable games list and returns them sorted by hybrid popularity
 * with updated dynamic badgeText and popularity stats.
 */
export function getRankedPlayableGames(
  playableGames,
  {
    leaderboardCounts = {},
    topScores = {},
    playCounts = {},
    favorites = [],
  } = {}
) {
  const scoredGames = playableGames.map(game => {
    const score = calculateGamePopularityScore({
      gameId: game.id,
      leaderboardCount: leaderboardCounts[game.id] || 0,
      topScore: topScores[game.id] || null,
      localPlayCount: playCounts[game.id] || 0,
      isFavorite: favorites.includes(game.id),
    });

    return {
      ...game,
      popularityScore: score,
    };
  });

  // Sort descending by popularity score
  scoredGames.sort((a, b) => b.popularityScore - a.popularityScore);

  // Assign dynamic badges based on calculated rank
  return scoredGames.map((game, idx) => {
    const rank = idx + 1;
    return {
      ...game,
      calculatedRank: rank,
      badgeText: getDynamicRankBadge(rank, game.id),
    };
  });
}
