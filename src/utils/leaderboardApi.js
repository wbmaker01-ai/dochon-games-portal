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
        try {
          localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicatedList));
        } catch (e) {}
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
 * Fetch ALL games' leaderboard rankings from Cloud DB in a SINGLE batch request.
 * Drastically reduces initial load time from ~6 seconds (32 serial requests) to ~0.2 seconds.
 * Returns an object: { [gameKey]: deduplicatedList }
 */
export async function getAllLeaderboardsFromDB() {
  const result = {};

  try {
    const res = await fetch(`${DB_API_URL}.json`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const allData = await res.json();
      if (allData && typeof allData === 'object') {
        for (const [gameKey, gameScores] of Object.entries(allData)) {
          if (gameScores && typeof gameScores === 'object') {
            const list = Object.keys(gameScores).map(key => ({
              id: key,
              ...gameScores[key]
            }));
            const deduplicatedList = deduplicateLeaderboard(list);
            result[gameKey] = deduplicatedList;
            try {
              localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicatedList));
            } catch (e) {}
          }
        }
        return result;
      }
    }
  } catch (err) {
    console.warn('[Backend DB] Batch Cloud DB fetch fallback to local storage:', err);
  }

  return result;
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

  // 1. Update Cloud DB first
  try {
    // If id exists directly
    if (id && !id.startsWith('local_')) {
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
      }
    } else {
      // Find key in Cloud DB by name/matching entry
      const getRes = await fetch(`${DB_API_URL}/${gameKey}.json`);
      if (getRes.ok) {
        const data = await getRes.json();
        if (data) {
          const matchKey = Object.keys(data).find(k => k === id || data[k].name === name || data[k].name === updatedName);
          if (matchKey) {
            await fetch(`${DB_API_URL}/${gameKey}/${matchKey}.json`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: updatedName,
                score: updatedScore
              })
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('[Backend DB] Failed to update score in Cloud Database:', err);
  }

  // 2. Update localStorage fallback copy
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    let list = stored ? JSON.parse(stored) : getLocalLeaderboardFallback(gameKey);
    const index = list.findIndex(item => String(item.id) === String(id) || item.name === name);
    if (index !== -1) {
      list[index].name = updatedName;
      list[index].score = updatedScore;
    } else {
      list.push({ id: id || `edit_${Date.now()}`, name: updatedName, score: updatedScore, date: new Date().toISOString().split('T')[0] });
    }
    localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicateLeaderboard(list)));
  } catch (e) {}

  return true;
}

/**
 * Delete a score record from the Cloud DB (Admin Feature)
 */
export async function deleteScoreFromDB(gameKey, id) {
  // 1. Delete from Cloud DB first
  try {
    if (id && !id.startsWith('local_')) {
      await fetch(`${DB_API_URL}/${gameKey}/${id}.json`, {
        method: 'DELETE'
      });
      console.log(`[Backend DB] Score ${id} successfully deleted from Cloud Database.`);
    }

    // Also check if any other duplicate keys exist in Cloud DB for this ID
    const getRes = await fetch(`${DB_API_URL}/${gameKey}.json`);
    if (getRes.ok) {
      const data = await getRes.json();
      if (data && data[id]) {
        await fetch(`${DB_API_URL}/${gameKey}/${id}.json`, {
          method: 'DELETE'
        });
      }
    }
  } catch (err) {
    console.error('[Backend DB] Failed to delete score from Cloud Database:', err);
  }

  // 2. Update localStorage fallback copy immediately
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    let list = stored ? JSON.parse(stored) : getLocalLeaderboardFallback(gameKey);
    list = list.filter(item => String(item.id) !== String(id));
    localStorage.setItem(`dochon_leaderboard_${gameKey}`, JSON.stringify(deduplicateLeaderboard(list)));
  } catch (e) {}

  return true;
}

/**
 * Fallback Local Leaderboard Reader
 */
function getLocalLeaderboardFallback(gameKey) {
  try {
    const stored = localStorage.getItem(`dochon_leaderboard_${gameKey}`);
    if (stored) return deduplicateLeaderboard(JSON.parse(stored));
  } catch (e) {}

  const fallbackMap = {
    pacman: [
      { id: 'p1', name: '김도촌 (5A)', score: 12400, date: '2026-08-12' },
      { id: 'p2', name: '이슬기 (4B)', score: 9800, date: '2026-08-12' },
      { id: 'p3', name: '박민준 (6C)', score: 8500, date: '2026-08-11' },
      { id: 'p4', name: '최하은 (3A)', score: 6200, date: '2026-08-10' },
      { id: 'p5', name: '정우진 (5B)', score: 4900, date: '2026-08-09' }
    ],
    dino: [
      { id: 'd1', name: '김홍년선생님', score: 1836, date: '2026-08-17' },
      { id: 'd2', name: '김도촌 (5A)', score: 1520, date: '2026-08-15' },
      { id: 'd3', name: '이달려 (4B)', score: 1180, date: '2026-08-15' },
      { id: 'd4', name: '박익룡 (6C)', score: 890, date: '2026-08-14' },
      { id: 'd5', name: '최선인장 (3A)', score: 650, date: '2026-08-14' }
    ],
    snake: [
      { id: 's1', name: '강스네이크 (6A)', score: 480, date: '2026-08-14' },
      { id: 's2', name: '김도촌 (5A)', score: 360, date: '2026-08-14' },
      { id: 's3', name: '이민서 (4C)', score: 280, date: '2026-08-13' },
      { id: 's4', name: '박지훈 (3B)', score: 190, date: '2026-08-12' },
      { id: 's5', name: '최예은 (5C)', score: 150, date: '2026-08-11' }
    ],
    solitaire: [
      { id: 'so1', name: '김홍년선생님', score: 890, date: '2026-08-17' },
      { id: 'so2', name: '김에이스 (6A)', score: 780, date: '2026-08-15' },
      { id: 'so3', name: '이스페이드 (5B)', score: 650, date: '2026-08-15' },
      { id: 'so4', name: '박하트 (4C)', score: 520, date: '2026-08-14' },
      { id: 'so5', name: '최클로버 (3A)', score: 410, date: '2026-08-14' }
    ],
    minesweeper: [
      { id: 'm1', name: '이지뢰 (6B)', score: 3200, date: '2026-08-16' },
      { id: 'm2', name: '김도촌 (5A)', score: 2450, date: '2026-08-16' },
      { id: 'm3', name: '박하늘 (4A)', score: 1800, date: '2026-08-15' },
      { id: 'm4', name: '정수빈 (3C)', score: 1250, date: '2026-08-15' },
      { id: 'm5', name: '최강우 (5B)', score: 850, date: '2026-08-14' }
    ],
    baseball: [
      { id: 'b1', name: '이홈런 (6A)', score: 4850, date: '2026-08-16' },
      { id: 'b2', name: '김도촌 (5A)', score: 3620, date: '2026-08-16' },
      { id: 'b3', name: '박타자 (4B)', score: 2750, date: '2026-08-16' },
      { id: 'b4', name: '최안타 (5C)', score: 1980, date: '2026-08-15' },
      { id: 'b5', name: '강슬러거 (3A)', score: 1240, date: '2026-08-15' }
    ],
    colortile: [
      { id: 'c1', name: '김타일 (6C)', score: 8600, date: '2026-08-16' },
      { id: 'c2', name: '이퍼즐 (5B)', score: 6400, date: '2026-08-16' },
      { id: 'c3', name: '김도촌 (5A)', score: 4950, date: '2026-08-16' },
      { id: 'c4', name: '박매칭 (4A)', score: 3200, date: '2026-08-16' },
      { id: 'c5', name: '최콤보 (3B)', score: 1800, date: '2026-08-16' }
    ],
    popcorn: [
      { id: 'pop1', name: '김홍년선생님', score: 1775, date: '2026-08-17' },
      { id: 'pop2', name: '김팝콘 (6A)', score: 1450, date: '2026-08-16' },
      { id: 'pop3', name: '이버터 (5B)', score: 1180, date: '2026-08-16' },
      { id: 'pop4', name: '박불꽃 (4C)', score: 890, date: '2026-08-15' },
      { id: 'pop5', name: '최옥수수 (3A)', score: 620, date: '2026-08-15' }
    ],
    tictactoe: [
      { id: 't1', name: '김홍년선생님', score: 660, date: '2026-08-17' },
      { id: 't2', name: '김도넛 (6A)', score: 550, date: '2026-08-16' },
      { id: 't3', name: '이딸기 (5B)', score: 420, date: '2026-08-16' },
      { id: 't4', name: '박초코 (4C)', score: 310, date: '2026-08-15' },
      { id: 't5', name: '최글레이즈 (3A)', score: 220, date: '2026-08-15' }
    ],
    champion: [
      { id: 'ch1', name: '김럭키 (6A)', score: 3200, date: '2026-08-16' },
      { id: 'ch2', name: '김도촌 (5A)', score: 2650, date: '2026-08-16' },
      { id: 'ch3', name: '이닌자 (4B)', score: 2100, date: '2026-08-16' },
      { id: 'ch4', name: '박챔피언 (5C)', score: 1750, date: '2026-08-15' },
      { id: 'ch5', name: '최두루마리 (3A)', score: 1200, date: '2026-08-15' }
    ],
    cricket: [
      { id: 'cr1', name: '김홍년선생님', score: 101, date: '2026-08-17' },
      { id: 'cr2', name: '김바운더리 (6A)', score: 95, date: '2026-08-17' },
      { id: 'cr3', name: '이스윙 (5B)', score: 82, date: '2026-08-17' },
      { id: 'cr4', name: '박볼러 (4C)', score: 68, date: '2026-08-16' },
      { id: 'cr5', name: '최크리켓 (3A)', score: 54, date: '2026-08-16' }
    ],
    ponyexpress: [
      { id: 'pe1', name: '김홍년선생님', score: 2096, date: '2026-08-17' },
      { id: 'pe2', name: '김라이더 (6A)', score: 1750, date: '2026-08-17' },
      { id: 'pe3', name: '이우편 (5B)', score: 1380, date: '2026-08-16' },
      { id: 'pe4', name: '박포니 (4C)', score: 990, date: '2026-08-16' },
      { id: 'pe5', name: '최배달 (3A)', score: 680, date: '2026-08-15' }
    ],
    jerrylawson: [
      { id: 'jl1', name: '김홍년선생님', score: 4315, date: '2026-08-17' },
      { id: 'jl2', name: '김카트리지 (6A)', score: 3600, date: '2026-08-17' },
      { id: 'jl3', name: '이픽셀 (5B)', score: 2850, date: '2026-08-16' },
      { id: 'jl4', name: '박도트 (4C)', score: 2100, date: '2026-08-16' },
      { id: 'jl5', name: '최레트로 (3A)', score: 1450, date: '2026-08-15' }
    ],
    magic: [
      { id: 'mg1', name: '김홍년선생님', score: 35375, date: '2026-08-17' },
      { id: 'mg2', name: '김매직 (6A)', score: 28400, date: '2026-08-17' },
      { id: 'mg3', name: '이지팡이 (5B)', score: 21500, date: '2026-08-16' },
      { id: 'mg4', name: '박스펠 (4C)', score: 15200, date: '2026-08-16' },
      { id: 'mg5', name: '최위자드 (3A)', score: 9800, date: '2026-08-15' }
    ],
    fruitmerge: [
      { id: 'fm1', name: '김홍년선생님', score: 13020, date: '2026-08-17' },
      { id: 'fm2', name: '김수박 (6A)', score: 9850, date: '2026-08-17' },
      { id: 'fm3', name: '이멜론 (5B)', score: 7400, date: '2026-08-16' },
      { id: 'fm4', name: '박파인애플 (4C)', score: 5200, date: '2026-08-16' },
      { id: 'fm5', name: '최딸기 (3A)', score: 3100, date: '2026-08-15' }
    ],
    brickbreaker: [
      { id: 'bb1', name: '김홍년선생님', score: 7870, date: '2026-08-17' },
      { id: 'bb2', name: '김벽돌 (6A)', score: 6200, date: '2026-08-17' },
      { id: 'bb3', name: '이레이저 (5B)', score: 4850, date: '2026-08-16' },
      { id: 'bb4', name: '박콤보 (4C)', score: 3400, date: '2026-08-16' },
      { id: 'bb5', name: '최볼 (3A)', score: 2150, date: '2026-08-15' }
    ],
    skyjumper: [
      { id: 'sj1', name: '김홍년선생님', score: 18450, date: '2026-08-19' },
      { id: 'sj2', name: '김점퍼 (6A)', score: 14200, date: '2026-08-19' },
      { id: 'sj3', name: '이로켓 (5B)', score: 11500, date: '2026-08-18' },
      { id: 'sj4', name: '박스프링 (4C)', score: 8300, date: '2026-08-18' },
      { id: 'sj5', name: '최우주 (3A)', score: 5400, date: '2026-08-17' }
    ],
    kidscoding: [
      { id: 'kc1', name: '김홍년선생님', score: 3200, date: '2026-08-20' },
      { id: 'kc2', name: '김알고 (6A)', score: 2800, date: '2026-08-20' },
      { id: 'kc3', name: '이루프 (5B)', score: 2400, date: '2026-08-19' },
      { id: 'kc4', name: '박토끼 (4C)', score: 1900, date: '2026-08-19' },
      { id: 'kc5', name: '최당근 (3A)', score: 1400, date: '2026-08-19' }
    ],
    bubbletea: [
      { id: 'bt1', name: '김홍년선생님', score: 2850, date: '2026-08-21' },
      { id: 'bt2', name: '김버블 (6A)', score: 2400, date: '2026-08-21' },
      { id: 'bt3', name: '이타로 (5B)', score: 1950, date: '2026-08-21' },
      { id: 'bt4', name: '박밀크 (4C)', score: 1500, date: '2026-08-21' },
      { id: 'bt5', name: '최흑당 (3A)', score: 1100, date: '2026-08-21' }
    ],
    memory: [
      { id: 'mem1', name: '김홍년선생님', score: 4800, date: '2026-08-23' },
      { id: 'mem2', name: '김두뇌 (6A)', score: 3950, date: '2026-08-23' },
      { id: 'mem3', name: '이기억 (5B)', score: 3100, date: '2026-08-23' },
      { id: 'mem4', name: '박퍼즐 (4C)', score: 2250, date: '2026-08-22' },
      { id: 'mem5', name: '최집중 (3A)', score: 1600, date: '2026-08-22' }
    ],
    microkart: [
      { id: 'mk1', name: '김홍년선생님', score: 5400, date: '2026-09-04' },
      { id: 'mk2', name: '김드리프트 (6A)', score: 4850, date: '2026-09-04' },
      { id: 'mk3', name: '이부스터 (5B)', score: 4100, date: '2026-09-03' },
      { id: 'mk4', name: '박바나나 (4C)', score: 3200, date: '2026-09-03' },
      { id: 'mk5', name: '최스피드 (3A)', score: 2450, date: '2026-09-02' }
    ]
  };

  if (fallbackMap[gameKey]) {
    return deduplicateLeaderboard(fallbackMap[gameKey]);
  }

  return deduplicateLeaderboard([
    { id: '1', name: '박민준 (6C)', score: 3450, date: '2026-08-12' },
    { id: '2', name: '김도촌 (5A)', score: 2890, date: '2026-08-12' },
    { id: '3', name: '윤서연 (4A)', score: 2100, date: '2026-08-11' },
    { id: '4', name: '강현우 (6A)', score: 1750, date: '2026-08-10' }
  ]);
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
