// Dochon Games Portal - Real-Time Backend Database Service
// Supports Cloud REST Database (Firebase / Supabase / Custom REST) & Hybrid Offline Sync

// Public Cloud Realtime Database Endpoint for Dochon Elementary School
const DB_API_URL = 'https://dochon-games-portal-bbdbc-default-rtdb.asia-southeast1.firebasedatabase.app/leaderboards';

/**
 * Deduplicate leaderboard array by player name, keeping ONLY the single highest score for each unique name.
 */
export function deduplicateLeaderboard(list) {
  if (!Array.isArray(list)) return [];

  const map = new Map();

  list.forEach(item => {
    const rawName = String(item.name || '').trim();
    if (!rawName) return;

    const itemScore = Number(item.score) || 0;

    if (!map.has(rawName)) {
      map.set(rawName, { ...item, name: rawName, score: itemScore });
    } else {
      const existing = map.get(rawName);
      const existingScore = Number(existing.score) || 0;

      // Keep the entry with the higher score
      if (itemScore > existingScore) {
        map.set(rawName, { ...item, name: rawName, score: itemScore });
      } else if (itemScore === existingScore) {
        // If scores are equal, keep the entry with more recent date/timestamp
        const itemTime = item.timestamp || (item.date ? new Date(item.date).getTime() : 0);
        const existingTime = existing.timestamp || (existing.date ? new Date(existing.date).getTime() : 0);
        if (itemTime >= existingTime) {
          map.set(rawName, { ...item, name: rawName, score: itemScore });
        }
      }
    }
  });

  const result = Array.from(map.values());
  result.sort((a, b) => Number(b.score) - Number(a.score));
  return result;
}

/**
 * Automatically migrate all locally stored custom scores/edits from localStorage to Firebase Cloud DB.
 * This runs upon app load to guarantee that any scores or edits previously made on this PC are safely pushed to the Cloud DB.
 */
export async function syncLocalStorageToCloudDB() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

  try {
    // 1. Fetch current Cloud DB root
    const res = await fetch(`${DB_API_URL}.json`);
    const cloudDb = res.ok ? (await res.json()) || {} : {};
    let hasChanges = false;
    const patchPayload = {};

    // 2. Scan all localStorage keys for dochon_leaderboard_*
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dochon_leaderboard_')) {
        const gameKey = key.replace('dochon_leaderboard_', '');
        try {
          const localList = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(localList) && localList.length > 0) {
            const currentCloudGame = cloudDb[gameKey] || {};
            const cloudItems = Object.keys(currentCloudGame).map(k => ({
              id: k,
              ...currentCloudGame[k]
            }));

            // Merge local and cloud lists, deduplicating and keeping highest score per unique name
            const merged = deduplicateLeaderboard([...cloudItems, ...localList]);

            // Construct Firebase-compatible key-value entries
            const newGameObject = {};
            merged.forEach((item, idx) => {
              const itemId = item.id && !item.id.startsWith('local_') ? item.id : `migrated_${idx}_${Date.now()}`;
              newGameObject[itemId] = {
                name: item.name,
                score: Number(item.score) || 0,
                date: item.date || new Date().toISOString().split('T')[0],
                timestamp: item.timestamp || Date.now()
              };
            });

            patchPayload[gameKey] = newGameObject;
            hasChanges = true;
          }
        } catch (e) {
          console.warn('[Migration] Error parsing localStorage key:', key, e);
        }
      }
    }

    // 3. If there are merged items to save, send batch PATCH to Firebase
    if (hasChanges && Object.keys(patchPayload).length > 0) {
      await fetch(`${DB_API_URL}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchPayload)
      });
      console.log('[Migration] Successfully synced all localStorage data to Firebase Cloud DB!');
    }
  } catch (err) {
    console.warn('[Migration] Cloud DB sync error:', err);
  }
}

/**
 * Fetch leaderboard rankings for a specific game from Cloud DB (Deduplicated by Name)
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
        
        // Deduplicate by Name (keep highest score per unique name)
        const deduplicatedList = deduplicateLeaderboard(list);
        
        // Save copy to localStorage for offline fallback
        localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicatedList));
        return deduplicatedList;
      }
    }
  } catch (err) {
    console.warn('[Backend DB] Cloud DB fetch fallback to local storage:', err);
  }

  // Local Storage Fallback
  return getLocalLeaderboardFallback(gameKey);
}

/**
 * Submit a new high score record to the Cloud DB (Updates existing record if higher, or pushes new)
 */
export async function submitScoreToDB(gameKey, name, score) {
  let cleanName = '도촌 학생';
  let newScore = 0;

  if (typeof name === 'object' && name !== null) {
    cleanName = String(name.name || '').trim() || '도촌 학생';
    newScore = Number(name.score) || 0;
  } else {
    cleanName = String(name || '').trim() || '도촌 학생';
    newScore = Number(score) || 0;
  }

  // Rule: Do not register scores of 100 or below to Leaderboard
  if (newScore <= 100) {
    return false;
  }

  const todayDate = new Date().toISOString().split('T')[0];
  const newEntry = {
    name: cleanName,
    score: newScore,
    date: todayDate,
    timestamp: Date.now()
  };

  // 1. Optimistic Local Storage Update (Ensures offline & instant availability)
  saveLocalLeaderboardFallback(gameKey, newEntry);

  // 2. Cloud DB Push / Sync (Non-blocking fallback)
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}.json`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        const existingKey = Object.keys(data).find(
          key => String(data[key].name || '').trim() === cleanName
        );

        if (existingKey) {
          const existingScore = Number(data[existingKey].score || 0);
          // Only update if new score is HIGHER than existing score
          if (newScore > existingScore) {
            await fetch(`${DB_API_URL}/${gameKey}/${existingKey}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                score: newScore,
                date: todayDate,
                timestamp: Date.now()
              })
            });
          }
          return true;
        }
      }
    }

    const postRes = await fetch(`${DB_API_URL}/${gameKey}.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry)
    });

    if (postRes.ok) {
      console.log('[Backend DB] High score successfully saved to Cloud Database!', newEntry);
    }
  } catch (err) {
    console.warn('[Backend DB] Cloud DB push unavailable, safely stored in Local Storage:', err);
  }

  // Safely return true as the high score is reliably persisted in Local Storage
  return true;
}

/**
 * Update an existing score record in the Cloud DB (Admin Feature)
 */
export async function updateScoreInDB(gameKey, id, name, score) {
  const updatedName = String(name).trim();
  const updatedScore = Number(score) || 0;

  // 1. Update localStorage fallback copy immediately
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    let list = stored ? JSON.parse(stored) : getLocalLeaderboardFallback(gameKey);
    const index = list.findIndex(item => String(item.id) === String(id));
    if (index !== -1) {
      list[index].name = updatedName;
      list[index].score = updatedScore;
      localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicateLeaderboard(list)));
    }
  } catch (e) {}

  // 2. Update Cloud DB
  try {
    const res = await fetch(`${DB_API_URL}/${gameKey}/${id}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updatedName,
        score: updatedScore
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
  // 1. Update localStorage fallback copy immediately
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    let list = stored ? JSON.parse(stored) : getLocalLeaderboardFallback(gameKey);
    list = list.filter(item => String(item.id) !== String(id));
    localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicateLeaderboard(list)));
  } catch (e) {}

  // 2. Delete from Cloud DB
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
    if (stored) return deduplicateLeaderboard(JSON.parse(stored));
  } catch (e) {}

  if (gameKey === 'pacman') {
    return deduplicateLeaderboard([
      { id: '1', name: '김도촌 (5A)', score: 12400, date: '2026-08-12' },
      { id: '2', name: '이슬기 (4B)', score: 9800, date: '2026-08-12' },
      { id: '3', name: '박민준 (6C)', score: 8500, date: '2026-08-11' },
      { id: '4', name: '최하은 (3A)', score: 6200, date: '2026-08-10' },
      { id: '5', name: '정우진 (5B)', score: 4900, date: '2026-08-09' }
    ]);
  } else if (gameKey === 'snake') {
    return deduplicateLeaderboard([
      { id: '1', name: '강스네이크 (6A)', score: 480, date: '2026-08-14' },
      { id: '2', name: '김도촌 (5A)', score: 360, date: '2026-08-14' },
      { id: '3', name: '이민서 (4C)', score: 280, date: '2026-08-13' },
      { id: '4', name: '박지훈 (3B)', score: 190, date: '2026-08-12' },
      { id: '5', name: '최예은 (5C)', score: 150, date: '2026-08-11' }
    ]);
  } else if (gameKey === 'minesweeper') {
    return deduplicateLeaderboard([
      { id: '1', name: '이지뢰 (6B)', score: 3200, date: '2026-08-16' },
      { id: '2', name: '김도촌 (5A)', score: 2450, date: '2026-08-16' },
      { id: '3', name: '박하늘 (4A)', score: 1800, date: '2026-08-15' },
      { id: '4', name: '정수빈 (3C)', score: 1250, date: '2026-08-15' },
      { id: '5', name: '최강우 (5B)', score: 850, date: '2026-08-14' }
    ]);
  } else if (gameKey === 'baseball') {
    return deduplicateLeaderboard([
      { id: '1', name: '이홈런 (6A)', score: 4850, date: '2026-08-16' },
      { id: '2', name: '김도촌 (5A)', score: 3620, date: '2026-08-16' },
      { id: '3', name: '박타자 (4B)', score: 2750, date: '2026-08-16' },
      { id: '4', name: '최안타 (5C)', score: 1980, date: '2026-08-15' },
      { id: '5', name: '강슬러거 (3A)', score: 1240, date: '2026-08-15' }
    ]);
  } else if (gameKey === 'colortile') {
    return deduplicateLeaderboard([
      { id: '1', name: '김타일 (6C)', score: 8600, date: '2026-08-16' },
      { id: '2', name: '이퍼즐 (5B)', score: 6400, date: '2026-08-16' },
      { id: '3', name: '김도촌 (5A)', score: 4950, date: '2026-08-16' },
      { id: '4', name: '박매칭 (4A)', score: 3200, date: '2026-08-16' },
      { id: '5', name: '최콤보 (3B)', score: 1800, date: '2026-08-16' }
    ]);
  } else if (gameKey === 'champion') {
    return deduplicateLeaderboard([
      { id: '1', name: '김럭키 (6A)', score: 3200, date: '2026-08-16' },
      { id: '2', name: '김도촌 (5A)', score: 2650, date: '2026-08-16' },
      { id: '3', name: '이닌자 (4B)', score: 2100, date: '2026-08-16' },
      { id: '4', name: '박챔피언 (5C)', score: 1750, date: '2026-08-15' },
      { id: '5', name: '최두루마리 (3A)', score: 1200, date: '2026-08-15' }
    ]);
  } else {
    return deduplicateLeaderboard([
      { id: '1', name: '박민준 (6C)', score: 3450, date: '2026-08-12' },
      { id: '2', name: '김도촌 (5A)', score: 2890, date: '2026-08-12' },
      { id: '3', name: '윤서연 (4A)', score: 2100, date: '2026-08-11' },
      { id: '4', name: '강현우 (6A)', score: 1750, date: '2026-08-10' }
    ]);
  }
}

/**
 * Fallback Local Leaderboard Writer
 */
function saveLocalLeaderboardFallback(gameKey, entry) {
  const current = getLocalLeaderboardFallback(gameKey);
  const updated = [...current, { ...entry, id: `local_${Date.now()}` }];
  const deduplicated = deduplicateLeaderboard(updated);
  localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicated));
}
