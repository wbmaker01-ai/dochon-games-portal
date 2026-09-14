// Dochon Games Portal - Dedicated Firebase RTDB WebRTC Signaling Engine
// Zero external PeerJS cloud dependencies - 100% Native W3C WebRTC & Browser EventSource
// Base Path: /leaderboards/p2p_signaling/${gameId}/${roomCode}

const DB_BASE_URL = 'https://dochon-games-portal-bbdbc-default-rtdb.asia-southeast1.firebasedatabase.app/leaderboards/p2p_signaling';

export class FirebaseSignaling {
  constructor(gameId = 'ghoulduel') {
    this.gameId = gameId;
    this.heartbeatTimer = null;
    this.eventSources = new Map(); // key -> EventSource
    this.pollTimers = new Map();   // key -> interval
  }

  _getRoomUrl(roomCode, subPath = '') {
    const cleanCode = String(roomCode || '').trim();
    const path = subPath ? `/${subPath}` : '';
    return `${DB_BASE_URL}/${this.gameId}/${cleanCode}${path}.json`;
  }

  // --- Host: Create a Room in Firebase RTDB ---
  async createRoom(roomCode, hostData) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode);

    // 1. Check if an active room already exists with recent heartbeat (< 20s)
    try {
      const checkRes = await fetch(url);
      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (existing && existing.host && existing.status === 'lobby') {
          const now = Date.now();
          const lastActive = existing.heartbeat || existing.createdAt || 0;
          if (now - lastActive < 20000) {
            throw new Error(`방 번호 [${cleanCode}]는 이미 다른 방장이 사용 중입니다. 다른 번호를 입력해 주세요.`);
          }
        }
      }
    } catch (err) {
      if (err.message && err.message.includes('이미 다른 방장이')) throw err;
      // If fetch fails, proceed with room creation
    }

    // 2. Write initial room state
    const now = Date.now();
    const initialPayload = {
      host: {
        id: 'host',
        name: (hostData.name || '방장').trim(),
        team: hostData.team || 'green',
        createdAt: now
      },
      status: 'lobby',
      heartbeat: now,
      guests: {}
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(initialPayload)
    });

    if (!res.ok) {
      throw new Error(`방 생성 실패 (HTTP ${res.status}). 네트워크 상태를 확인해 주세요.`);
    }

    // 3. Start 8-second Heartbeat
    this.startHeartbeat(cleanCode);

    return cleanCode;
  }

  // --- Host: Heartbeat Keep-Alive ---
  startHeartbeat(roomCode) {
    this.stopHeartbeat();
    const cleanCode = String(roomCode || '').trim();
    const heartbeatUrl = this._getRoomUrl(cleanCode);

    this.heartbeatTimer = setInterval(async () => {
      try {
        await fetch(heartbeatUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ heartbeat: Date.now() })
        });
      } catch (e) {
        // Silently tolerate temporary network blips
      }
    }, 8000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- Guest: Check Room Availability ---
  async checkRoom(roomCode) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`시그널링 서버 연결 실패 (HTTP ${res.status})`);
    }

    const room = await res.json();
    if (!room || !room.host) {
      throw new Error(`방 번호 [${cleanCode}]을 찾을 수 없습니다. 방장이 방을 열었는지 확인해 주세요.`);
    }

    const now = Date.now();
    const lastActive = room.heartbeat || room.host.createdAt || 0;
    if (now - lastActive > 35000) {
      throw new Error(`방 번호 [${cleanCode}]의 방장 연결이 끊어졌습니다. 방장에게 다시 방을 열어달라고 요청해 주세요.`);
    }

    if (room.status !== 'lobby') {
      throw new Error(`방 번호 [${cleanCode}]는 이미 게임이 진행 중입니다.`);
    }

    return room;
  }

  // --- Host: Listen for Incoming Guests ---
  listenForGuests(roomCode, onGuestJoin) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/guests.json`;
    const knownGuests = new Set();

    const handleGuestsData = (guestsObj) => {
      if (!guestsObj || typeof guestsObj !== 'object') return;
      Object.keys(guestsObj).forEach((guestId) => {
        const guestData = guestsObj[guestId];
        if (guestData && guestData.offer && !knownGuests.has(guestId)) {
          knownGuests.add(guestId);
          onGuestJoin(guestId, guestData);
        }
      });
    };

    // 1. Primary: Native Browser EventSource (SSE)
    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) {
            if (parsed.path === '/') {
              handleGuestsData(parsed.data);
            } else {
              // Specific guest update like "/g_1234"
              const key = parsed.path.replace(/^\//, '').split('/')[0];
              if (key && parsed.data.offer) {
                handleGuestsData({ [key]: parsed.data });
              }
            }
          }
        } catch (err) {}
      });

      es.addEventListener('patch', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleGuestsData(parsed.data);
        } catch (err) {}
      });

      this.eventSources.set(`guests_${cleanCode}`, es);
    } catch (e) {
      console.warn('EventSource not supported, using fallback polling:', e);
    }

    // 2. Secondary: Robust Fallback Polling (every 1.5s) to guarantee zero packet loss
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleGuestsData(data);
        }
      } catch (e) {}
    }, 1500);

    this.pollTimers.set(`guests_${cleanCode}`, pollInterval);
  }

  // --- Host: Send SDP Answer to Guest ---
  async sendAnswer(roomCode, guestId, answer) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `guests/${guestId}/answer`);

    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: answer.type,
        sdp: answer.sdp
      })
    });
  }

  // --- Host: Push Host ICE Candidate for Guest ---
  async sendHostCandidate(roomCode, guestId, candidate) {
    if (!candidate) return;
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `guests/${guestId}/hostCandidates`);

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        })
      });
    } catch (e) {}
  }

  // --- Host: Listen for Guest ICE Candidates ---
  listenForGuestCandidates(roomCode, guestId, onCandidate) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/guests/${guestId}/guestCandidates.json`;
    const seenCandidates = new Set();

    const handleCandidates = (data) => {
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach((key) => {
        if (!seenCandidates.has(key)) {
          seenCandidates.add(key);
          const c = data[key];
          if (c && c.candidate) {
            onCandidate(c);
          }
        }
      });
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleCandidates(parsed.data);
        } catch (err) {}
      });
      this.eventSources.set(`gcand_${guestId}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleCandidates(data);
        }
      } catch (e) {}
    }, 1200);

    this.pollTimers.set(`gcand_${guestId}`, poll);
  }

  // --- Guest: Join Room with SDP Offer ---
  async joinRoomWithOffer(roomCode, guestId, guestInfo, offer) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `guests/${guestId}`);

    const payload = {
      id: guestId,
      name: (guestInfo.name || '도촌 학생').trim(),
      team: guestInfo.team || 'purple',
      offer: {
        type: offer.type,
        sdp: offer.sdp
      },
      createdAt: Date.now()
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`입장 요청 전송 실패 (HTTP ${res.status})`);
    }
  }

  // --- Guest: Listen for SDP Answer from Host ---
  listenForAnswer(roomCode, guestId, onAnswer) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/guests/${guestId}/answer.json`;
    let answered = false;

    const handleAnswer = (data) => {
      if (answered || !data) return;
      if (data.type === 'answer' && data.sdp) {
        answered = true;
        onAnswer(data);
      }
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleAnswer(parsed.data);
        } catch (err) {}
      });
      this.eventSources.set(`ans_${guestId}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      if (answered) return;
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleAnswer(data);
        }
      } catch (e) {}
    }, 800);

    this.pollTimers.set(`ans_${guestId}`, poll);
  }

  // --- Guest: Push Guest ICE Candidate for Host ---
  async sendGuestCandidate(roomCode, guestId, candidate) {
    if (!candidate) return;
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `guests/${guestId}/guestCandidates`);

    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex
        })
      });
    } catch (e) {}
  }

  // --- Guest: Listen for Host ICE Candidates ---
  listenForHostCandidates(roomCode, guestId, onCandidate) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/guests/${guestId}/hostCandidates.json`;
    const seenCandidates = new Set();

    const handleCandidates = (data) => {
      if (!data || typeof data !== 'object') return;
      Object.keys(data).forEach((key) => {
        if (!seenCandidates.has(key)) {
          seenCandidates.add(key);
          const c = data[key];
          if (c && c.candidate) {
            onCandidate(c);
          }
        }
      });
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleCandidates(parsed.data);
        } catch (err) {}
      });
      this.eventSources.set(`hcand_${guestId}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleCandidates(data);
        }
      } catch (e) {}
    }, 1200);

    this.pollTimers.set(`hcand_${guestId}`, poll);
  }

  // --- Cleanup Signaling Data for Guest (Leaves Database 0 Bytes) ---
  async cleanupGuestSignaling(roomCode, guestId) {
    const cleanCode = String(roomCode || '').trim();

    // Close listeners
    const esKeys = [`ans_${guestId}`, `gcand_${guestId}`, `hcand_${guestId}`];
    esKeys.forEach((k) => {
      if (this.eventSources.has(k)) {
        try { this.eventSources.get(k).close(); } catch (e) {}
        this.eventSources.delete(k);
      }
      if (this.pollTimers.has(k)) {
        clearInterval(this.pollTimers.get(k));
        this.pollTimers.delete(k);
      }
    });

    // Delete guest signaling node from Firebase
    const url = this._getRoomUrl(cleanCode, `guests/${guestId}`);
    try {
      await fetch(url, { method: 'DELETE' });
    } catch (e) {}
  }

  // ==========================================
  // --- REAL-TIME RELAY FALLBACK SUBSYSTEM ---
  // ==========================================

  // --- Guest: Send Relay Message to Host ---
  async sendRelayGuestMessage(roomCode, guestId, msg) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `relays/${guestId}/guest_msg`);
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...msg, _ts: Date.now() })
      });
    } catch (e) {}
  }

  // --- Host: Send Relay Message to Guest ---
  async sendRelayHostMessage(roomCode, guestId, msg) {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode, `relays/${guestId}/host_msg`);
    try {
      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...msg, _ts: Date.now() })
      });
    } catch (e) {}
  }

  // --- Guest: Listen to Relay Messages from Host ---
  listenRelayHostMessages(roomCode, guestId, onMessage) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/relays/${guestId}/host_msg.json`;
    let lastTs = 0;

    const handleMsg = (data) => {
      if (!data || typeof data !== 'object') return;
      if (data._ts && data._ts !== lastTs) {
        lastTs = data._ts;
        onMessage(data);
      }
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleMsg(parsed.data);
        } catch (err) {}
      });
      this.eventSources.set(`relay_host_${guestId}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleMsg(data);
        }
      } catch (e) {}
    }, 250);

    this.pollTimers.set(`relay_host_${guestId}`, poll);
  }

  // --- Host: Listen to Relay Messages from Specific Guest ---
  listenRelayGuestMessages(roomCode, guestId, onMessage) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/relays/${guestId}/guest_msg.json`;
    let lastTs = 0;

    const handleMsg = (data) => {
      if (!data || typeof data !== 'object') return;
      if (data._ts && data._ts !== lastTs) {
        lastTs = data._ts;
        onMessage(data);
      }
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) handleMsg(parsed.data);
        } catch (err) {}
      });
      this.eventSources.set(`relay_guest_${guestId}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          handleMsg(data);
        }
      } catch (e) {}
    }, 250);

    this.pollTimers.set(`relay_guest_${guestId}`, poll);
  }

  // --- Host: Listen to Any Guest Entering Relay Mode ---
  listenAllRelays(roomCode, onGuestRelayJoin) {
    const cleanCode = String(roomCode || '').trim();
    const sseUrl = `${DB_BASE_URL}/${this.gameId}/${cleanCode}/relays.json`;
    const knownRelays = new Set();

    const checkRelays = (relaysObj) => {
      if (!relaysObj || typeof relaysObj !== 'object') return;
      Object.keys(relaysObj).forEach((guestId) => {
        const entry = relaysObj[guestId];
        if (!entry) return;
        const msg = entry.guest_msg || (entry.type ? entry : null);
        if (msg && msg.type === 'JOIN_LOBBY' && !knownRelays.has(guestId)) {
          knownRelays.add(guestId);
          onGuestRelayJoin(guestId, msg);
        }
      });
    };

    let es = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('put', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.data) {
            if (parsed.path === '/') checkRelays(parsed.data);
            else {
              const gid = parsed.path.replace(/^\//, '').split('/')[0];
              if (gid) checkRelays({ [gid]: parsed.data });
            }
          }
        } catch (err) {}
      });
      this.eventSources.set(`relays_${cleanCode}`, es);
    } catch (e) {}

    const poll = setInterval(async () => {
      try {
        const res = await fetch(sseUrl);
        if (res.ok) {
          const data = await res.json();
          checkRelays(data);
        }
      } catch (e) {}
    }, 1000);

    this.pollTimers.set(`relays_${cleanCode}`, poll);
  }

  // --- Cleanup Specific Relay Node ---
  async cleanupRelay(roomCode, guestId) {
    const cleanCode = String(roomCode || '').trim();
    const keys = [`relay_host_${guestId}`, `relay_guest_${guestId}`];
    keys.forEach((k) => {
      if (this.eventSources.has(k)) {
        try { this.eventSources.get(k).close(); } catch (e) {}
        this.eventSources.delete(k);
      }
      if (this.pollTimers.has(k)) {
        clearInterval(this.pollTimers.get(k));
        this.pollTimers.delete(k);
      }
    });

    const url = this._getRoomUrl(cleanCode, `relays/${guestId}`);
    try {
      await fetch(url, { method: 'DELETE' });
    } catch (e) {}
  }

  // --- Update Room Status (e.g. 'playing') ---
  async updateRoomStatus(roomCode, status = 'playing') {
    const cleanCode = String(roomCode || '').trim();
    const url = this._getRoomUrl(cleanCode);
    try {
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {}
  }

  // --- Close Room Alias ---
  async closeRoom(roomCode) {
    return this.cleanupRoom(roomCode);
  }

  // --- General Cleanup for Listeners ---
  cleanup() {
    this.stopHeartbeat();
    this.eventSources.forEach((es) => {
      try { es.close(); } catch (e) {}
    });
    this.eventSources.clear();
    this.pollTimers.forEach((timer) => {
      clearInterval(timer);
    });
    this.pollTimers.clear();
  }

  // --- Cleanup Entire Room (When Host Leaves or Match Ends) ---
  async cleanupRoom(roomCode) {
    this.cleanup();
    const cleanCode = String(roomCode || '').trim();

    // Delete room node from Firebase
    const url = this._getRoomUrl(cleanCode);
    try {
      await fetch(url, { method: 'DELETE' });
    } catch (e) {}
  }
}
