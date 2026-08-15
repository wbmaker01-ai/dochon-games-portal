// Leaderboard Store for Dochon Games Portal

const STORAGE_KEY = 'dochon_games_leaderboard_v1';

const INITIAL_SCORES = {
  pacman: [
    { id: 'p1', name: '김도촌 (6학년 1반)', score: 3250, date: '2026-08-10' },
    { id: 'p2', name: '이마스코트 (5학년 3반)', score: 2800, date: '2026-08-11' },
    { id: 'p3', name: '박급식 (6학년 2반)', score: 2450, date: '2026-08-12' },
    { id: 'p4', name: '최선생 (교직원)', score: 2100, date: '2026-08-09' },
    { id: 'p5', name: '정열공 (4학년 1반)', score: 1850, date: '2026-08-12' }
  ],
  dino: [
    { id: 'd1', name: '박달리기 (5학년 2반)', score: 1420, date: '2026-08-12' },
    { id: 'd2', name: '김도촌 (6학년 1반)', score: 1150, date: '2026-08-11' },
    { id: 'd3', name: '이점프 (4학년 3반)', score: 980, date: '2026-08-13' },
    { id: 'd4', name: '강도촌 (6학년 4반)', score: 840, date: '2026-08-10' },
    { id: 'd5', name: '윤체육 (3학년 1반)', score: 720, date: '2026-08-08' }
  ],
  snake: [
    { id: 's1', name: '도촌스네이크 (6학년 3반)', score: 680, date: '2026-08-01' }
  ]
};

export const getLeaderboard = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SCORES));
      return INITIAL_SCORES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading leaderboard:', e);
    return INITIAL_SCORES;
  }
};

export const saveScore = (gameKey, name, score) => {
  const numScore = Number(score) || 0;
  // Rule: Do not register scores of 100 or below to Leaderboard
  if (numScore <= 100) return;

  const current = getLeaderboard();
  const gameScores = current[gameKey] || [];

  const newEntry = {
    id: Date.now().toString(),
    name: name || '도촌학생',
    score: numScore,
    date: new Date().toISOString().split('T')[0]
  };

  const updatedGameScores = [...gameScores, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Keep top 10

  const updated = {
    ...current,
    [gameKey]: updatedGameScores
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving score:', e);
  }

  // Check if it's a new high score
  const isTop1 = updatedGameScores[0].id === newEntry.id;
  const isTop10 = updatedGameScores.some(item => item.id === newEntry.id);

  return { updated, isTop1, isTop10 };
};

export const getHighScore = (gameKey) => {
  const scores = getLeaderboard()[gameKey] || [];
  return scores.length > 0 ? scores[0].score : 0;
};
