// Dochon Games Portal - Real-Time Backend Database Service
// Supports Cloud REST Database (Firebase / Supabase / Custom REST) & Hybrid Offline Sync

// Public Cloud Realtime Database Endpoint for Dochon Elementary School
const DB_API_URL = 'https://dochon-games-portal-default-rtdb.asia-southeast1.firebasedatabase.app/leaderboards';

/**
 * Fetch leaderboard rankings for a specific game from Cloud DB
 */
export async function getLeaderboardFromDB(gameKey = 'pacman') {
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}.json`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (data) {
        // Firebase returns objects keyed by ID; convert to array
        const list = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        
        // Sort descending by score
        list.sort((a, b) => b.score - a.score);
        
        // Save copy to localStorage for offline fallback
        localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(list.slice(0, 10)));
        return list;
      }
    }
  } catch (err) {
    console.warn('[Backend DB] Cloud DB fetch fallback to local storage:', err);
  }

  // Local Storage Fallback
  return getLocalLeaderboardFallback(gameKey);
}

/**
 * Submit a new high score record to the Cloud DB
 */
export async function submitScoreToDB(gameKey, name, score) {
  const newEntry = {
    name: name.trim() || '도촌 학생',
    score: Number(score) || 0,
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now()
  };

  // 1. Local Storage immediate update
  saveLocalLeaderboardFallback(gameKey, newEntry);

  // 2. Cloud DB Push
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });

    if (res.ok) {
      console.log('[Backend DB] High score successfully saved to Cloud Database!', newEntry);
      return true;
    }
  } catch (err) {
    console.error('[Backend DB] Failed to push to Cloud Database, saved locally:', err);
  }

  return false;
}

/**
 * Update an existing score record in the Cloud DB (Admin Feature)
 */
export async function updateScoreInDB(gameKey, id, name, score) {
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}/${id}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        score: Number(score)
      })
    });

    if (res.ok) {
      console.log(`[Backend DB] Score ${id} successfully updated in Cloud Database.`);
      return true;
    }
  } catch (err) {
    console.error('[Backend DB] Failed to update score in Cloud Database:', err);
  }

  return false;
}

/**
 * Delete a score record from the Cloud DB (Admin Feature)
 */
export async function deleteScoreFromDB(gameKey, id) {
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}/${id}.json`, {
      method: 'DELETE'
    });

    if (res.ok) {
      console.log(`[Backend DB] Score ${id} successfully deleted from Cloud Database.`);
      return true;
    }
  } catch (err) {
    console.error('[Backend DB] Failed to delete score from Cloud Database:', err);
  }

  return false;
}

/**
 * Fallback Local Leaderboard Reader
 */
function getLocalLeaderboardFallback(gameKey) {
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  if (gameKey === 'pacman') {
    return [
      { id: '1', name: '김도촌 (5A)', score: 12400, date: '2026-08-12' },
      { id: '2', name: '이슬기 (4B)', score: 9800, date: '2026-08-12' },
      { id: '3', name: '박민준 (6C)', score: 8500, date: '2026-08-11' },
      { id: '4', name: '최하은 (3A)', score: 6200, date: '2026-08-10' },
      { id: '5', name: '정우진 (5B)', score: 4900, date: '2026-08-09' }
    ];
  } else {
    return [
      { id: '1', name: '박민준 (6C)', score: 3450, date: '2026-08-12' },
      { id: '2', name: '김도촌 (5A)', score: 2890, date: '2026-08-12' },
      { id: '3', name: '윤서연 (4A)', score: 2100, date: '2026-08-11' },
      { id: '4', name: '강현우 (6A)', score: 1750, date: '2026-08-10' }
    ];
  }
}

/**
 * Fallback Local Leaderboard Writer
 */
function saveLocalLeaderboardFallback(gameKey, entry) {
  const current = getLocalLeaderboardFallback(gameKey);
  const updated = [...current, { ...entry, id: `local_${Date.now()}` }];
  updated.sort((a, b) => b.score - a.score);
  localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(updated.slice(0, 10)));
}
