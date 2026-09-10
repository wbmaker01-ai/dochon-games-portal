// Dochon Games Portal - The Great Ghoul Duel WebRTC P2P Network Manager
// Dedicated Firebase RTDB WebRTC Signaling (Zero external PeerJS dependencies)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to Firebase RTDB Room Broker
// v5: Native W3C RTCPeerConnection + RTCDataChannel with High-Reliability STUN/TURN Pool

import { FirebaseSignaling } from '../../../utils/firebaseSignaling';

// Robust Multi-tier ICE Servers: Google, Cloudflare, Twilio STUN + Metered Ports 80/443 TURN
const ICE_SERVERS = [
  // Fast Global STUN servers for direct NAT traversal
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  // Primary Metered TURN relay servers (ports 80/443 HTTP/HTTPS bypass)
  {
    urls: 'turn:global.relay.metered.ca:80',
    username: 'e8dd65b92f3b1e1ae3a37c20',
    credential: 'gVNgSOl87pwvCYLu'
  },
  {
    urls: 'turn:global.relay.metered.ca:80?transport=tcp',
    username: 'e8dd65b92f3b1e1ae3a37c20',
    credential: 'gVNgSOl87pwvCYLu'
  },
  {
    urls: 'turn:global.relay.metered.ca:443',
    username: 'e8dd65b92f3b1e1ae3a37c20',
    credential: 'gVNgSOl87pwvCYLu'
  },
  {
    urls: 'turns:global.relay.metered.ca:443?transport=tcp',
    username: 'e8dd65b92f3b1e1ae3a37c20',
    credential: 'gVNgSOl87pwvCYLu'
  },
  // OpenRelay Public Fallback TURN
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

const CONNECTION_TIMEOUT_MS = 15000; // 15s overall connection timeout
const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2 // Lean candidate pool to avoid socket exhaustion
};

export class GhoulDuelNetworkManager {
  constructor() {
    this.signaling = new FirebaseSignaling('ghoulduel');

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.myTeam = 'green';

    // Host State: Map of guestId -> { pc, dc, player }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, team, isHost, isReady, slotIndex }]

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null; // Status messages for UI feedback
    this.onGuestInput = null;
  }

  // Generate a random 4-digit numeric room code (e.g. 1000 ~ 9999)
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // Sanitize any input code to strict 4 digits (e.g. " 12 34 " -> "1234")
  static sanitizeCode(rawCode) {
    const digitsOnly = String(rawCode || '').replace(/[^0-9]/g, '');
    if (!digitsOnly) return '0000';
    return digitsOnly.padStart(4, '0').slice(0, 4);
  }

  // Emit a user-facing connection status message
  _emitStatus(message) {
    if (this.onConnectionStatus) this.onConnectionStatus(message);
  }

  // --- HOST: Create a P2P Room via Firebase RTDB Signaling ---
  async createRoom(numericCode, playerName, team = 'green') {
    this.disconnect();

    const cleanCode = GhoulDuelNetworkManager.sanitizeCode(numericCode);
    this.roomCode = cleanCode;
    this.isHost = true;
    this.myPeerId = 'host';
    this.myName = (playerName || '방장').trim();
    this.myTeam = team;

    this._emitStatus('🔗 도촌초 전용 시그널링 서버 연결 중...');

    try {
      // 1. Register room in Firebase RTDB
      await this.signaling.createRoom(cleanCode, {
        name: this.myName,
        team: this.myTeam
      });

      this.lobbyPlayers = [
        {
          id: 'host',
          name: this.myName,
          team: this.myTeam,
          isHost: true,
          isReady: true,
          slotIndex: 0
        }
      ];

      this._emitStatus('✅ 방이 생성되었습니다! 친구들의 접속을 기다리는 중...');
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);

      // 2. Listen for incoming guest join offers in Firebase RTDB
      this.signaling.listenForGuests(cleanCode, (guestId, guestData) => {
        this.handleIncomingGuest(guestId, guestData);
      });

      return cleanCode;
    } catch (err) {
      const errorMsg = err.message || '방 생성 중 오류가 발생했습니다.';
      this._emitStatus(`❌ ${errorMsg}`);
      if (this.onError) this.onError(errorMsg);
      this.disconnect();
      throw err;
    }
  }

  // --- HOST: Handle Incoming Guest WebRTC Offer ---
  async handleIncomingGuest(guestId, guestData) {
    // If already connected or room is full, ignore
    if (this.connections.has(guestId)) return;
    if (this.lobbyPlayers.length >= 8) return;

    this._emitStatus(`👋 ${guestData.name || '친구'}님이 입장을 시도합니다...`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    let dc = null;

    // Buffer ICE candidates until remote description is set
    const candidateQueue = [];
    let isRemoteDescSet = false;

    // Stream host ICE candidates to Firebase RTDB for this guest
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendHostCandidate(this.roomCode, guestId, event.candidate);
      }
    };

    // Listen for incoming RTCDataChannel from guest
    pc.ondatachannel = (event) => {
      dc = event.channel;
      this.setupHostDataChannel(guestId, pc, dc, guestData);
    };

    try {
      // Set Guest's SDP Offer
      await pc.setRemoteDescription(new RTCSessionDescription(guestData.offer));
      isRemoteDescSet = true;

      // Drain any queued candidates
      for (const cand of candidateQueue) {
        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
      }

      // Create Host's SDP Answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send Answer to Firebase RTDB
      await this.signaling.sendAnswer(this.roomCode, guestId, answer);

      // Listen for Guest's ICE candidates from Firebase RTDB
      this.signaling.listenForGuestCandidates(this.roomCode, guestId, (cand) => {
        if (!isRemoteDescSet) {
          candidateQueue.push(cand);
        } else {
          pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      });
    } catch (err) {
      console.error('Host WebRTC Offer/Answer handshake error:', err);
      pc.close();
    }
  }

  // --- HOST: Setup DataChannel for Connected Guest ---
  setupHostDataChannel(guestId, pc, dc, guestData) {
    dc.onopen = () => {
      // Team balancing
      const greenCount = this.lobbyPlayers.filter((p) => p.team === 'green').length;
      const purpleCount = this.lobbyPlayers.filter((p) => p.team === 'purple').length;
      const assignedTeam = guestData.team || (greenCount <= purpleCount ? 'green' : 'purple');

      const newPlayer = {
        id: guestId,
        name: (guestData.name || `친구-${this.lobbyPlayers.length + 1}`).trim(),
        team: assignedTeam,
        isHost: false,
        isReady: true,
        slotIndex: this.lobbyPlayers.length
      };

      this.lobbyPlayers.push(newPlayer);
      this.connections.set(guestId, { pc, dc, player: newPlayer });

      // Send 3-Way Handshake ACK over P2P DataChannel
      try {
        dc.send(
          JSON.stringify({
            type: 'JOIN_ACK',
            accepted: true,
            players: this.lobbyPlayers,
            assignedTeam: newPlayer.team,
            slotIndex: newPlayer.slotIndex
          })
        );
      } catch (e) {}

      // Clean up guest signaling node in Firebase RTDB (Zero bytes left!)
      this.signaling.cleanupGuestSignaling(this.roomCode, guestId);

      this._emitStatus(`🎉 ${newPlayer.name}님이 ${assignedTeam === 'green' ? '초록 영혼팀' : '보라 유령팀'}에 합류!`);
      this.broadcastLobbyUpdate();
    };

    dc.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleHostReceiveData(guestId, data);
      } catch (err) {
        console.error('Host error parsing DataChannel message:', err);
      }
    };

    dc.onclose = () => {
      this.handlePeerLeave(guestId);
    };

    dc.onerror = (err) => {
      console.warn('Host DataChannel error with guest:', guestId, err);
      this.handlePeerLeave(guestId);
    };
  }

  handleHostReceiveData(peerId, data) {
    if (!data || !data.type) return;

    if (data.type === 'TOGGLE_TEAM') {
      const player = this.lobbyPlayers.find((p) => p.id === peerId);
      if (player) {
        player.team = player.team === 'green' ? 'purple' : 'green';
        this.broadcastLobbyUpdate();
      }
    } else if (data.type === 'INPUT') {
      // Forward complete input & position packet to host logic engine
      if (this.onGuestInput) {
        this.onGuestInput(peerId, data);
      }
    }
  }

  handlePeerLeave(peerId) {
    const connObj = this.connections.get(peerId);
    if (connObj) {
      try { connObj.dc?.close(); } catch (e) {}
      try { connObj.pc?.close(); } catch (e) {}
      this.connections.delete(peerId);
    }

    const leaving = this.lobbyPlayers.find((p) => p.id === peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);

    if (leaving) {
      this._emitStatus(`👋 ${leaving.name}님이 나갔습니다.`);
    }
    this.broadcastLobbyUpdate();
    if (this.onPeerLeft) this.onPeerLeft(peerId);
  }

  // --- GUEST: Join Room via Firebase RTDB Signaling ---
  joinRoom(numericCode, playerName, team = 'green') {
    return new Promise(async (resolve, reject) => {
      this.disconnect();

      const cleanCode = GhoulDuelNetworkManager.sanitizeCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = (playerName || '도촌 학생').trim();
      this.myTeam = team;
      const guestId = `g_${Math.random().toString(36).slice(2, 9)}`;
      this.myPeerId = guestId;

      this._emitStatus(`🔍 방 찾는 중... (방 번호: [${cleanCode}])`);

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.disconnect();
          const errorMsg = `방 번호 [${cleanCode}]에 연결할 수 없습니다. 방장이 대기 중인지 확인해 주세요.`;
          this._emitStatus(`❌ ${errorMsg}`);
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        }
      }, CONNECTION_TIMEOUT_MS);

      const settle = (type, val) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (type === 'resolve') resolve(val);
        else reject(val);
      };

      try {
        // 1. Verify room in Firebase RTDB
        await this.signaling.checkRoom(cleanCode);

        this._emitStatus('⚡ P2P 터널 수립 준비 중 (WebRTC 핸드셰이크)...');

        // 2. Create RTCPeerConnection & DataChannel
        const pc = new RTCPeerConnection(RTC_CONFIG);
        const dc = pc.createDataChannel('ghoulGameChannel', { ordered: true });
        this.hostConnection = { pc, dc };

        const candidateQueue = [];
        let isRemoteDescSet = false;

        // Stream guest ICE candidates to Firebase RTDB
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.signaling.sendGuestCandidate(cleanCode, guestId, event.candidate);
          }
        };

        // DataChannel event handlers
        dc.onopen = () => {
          this._emitStatus('⚡ P2P 터널 수립 완료! 대기실 입장 확인 중...');
        };

        dc.onmessage = (event) => {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            // Handle Handshake ACK from Host
            if (data.type === 'JOIN_ACK') {
              if (data.accepted) {
                this.lobbyPlayers = data.players || [];
                if (data.assignedTeam) this.myTeam = data.assignedTeam;
                this._emitStatus('🎉 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);

                // Clean up guest signaling data from Firebase RTDB (Zero bytes left!)
                this.signaling.cleanupGuestSignaling(cleanCode, guestId);

                settle('resolve', cleanCode);
              } else {
                const errorMsg = data.message || '방 입장이 거부되었습니다.';
                this._emitStatus(`❌ ${errorMsg}`);
                if (this.onError) this.onError(errorMsg);
                settle('reject', new Error(errorMsg));
              }
              return;
            }

            this.handleGuestReceiveData(data);
          } catch (err) {
            console.error('Guest error parsing DataChannel message:', err);
          }
        };

        dc.onclose = () => {
          const errorMsg = '방장과의 연결이 끊어졌습니다.';
          this._emitStatus(`⚠️ ${errorMsg}`);
          if (this.onDisconnect) this.onDisconnect(errorMsg);
        };

        dc.onerror = (err) => {
          console.warn('Guest DataChannel error:', err);
        };

        // 3. Create WebRTC SDP Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // 4. Post Offer to Firebase RTDB
        await this.signaling.joinRoomWithOffer(
          cleanCode,
          guestId,
          { name: this.myName, team: this.myTeam },
          offer
        );

        this._emitStatus('🤝 방장에게 입장 요청(SDP Offer) 전달 완료. 응답 대기 중...');

        // 5. Listen for Host's SDP Answer in Firebase RTDB
        this.signaling.listenForAnswer(cleanCode, guestId, async (answer) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            isRemoteDescSet = true;

            // Drain any buffered host candidates
            for (const cand of candidateQueue) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
            }
          } catch (err) {
            console.error('Error setting remote answer:', err);
          }
        });

        // 6. Listen for Host's ICE Candidates in Firebase RTDB
        this.signaling.listenForHostCandidates(cleanCode, guestId, (cand) => {
          if (!isRemoteDescSet) {
            candidateQueue.push(cand);
          } else {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
        });
      } catch (err) {
        settle('reject', err);
      }
    });
  }

  handleGuestReceiveData(data) {
    if (!data || !data.type) return;

    if (data.type === 'LOBBY_UPDATE') {
      this.lobbyPlayers = data.players || [];
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
    } else if (data.type === 'START_GAME') {
      if (this.onGameStart) this.onGameStart(data);
    } else if (data.type === 'SNAPSHOT') {
      if (this.onSnapshot) this.onSnapshot(data.snapshot);
    } else if (data.type === 'GAME_OVER') {
      if (this.onGameOver) this.onGameOver(data.stats);
    } else if (data.type === 'ERROR') {
      if (this.onError) this.onError(data.message);
    }
  }

  // Send player input & authoritative position from Guest to Host
  sendInput(data) {
    if (!this.isHost && this.hostConnection && this.hostConnection.dc && this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(
          JSON.stringify({
            type: 'INPUT',
            ...data
          })
        );
      } catch (e) {}
    }
  }

  // Toggle my team in lobby
  toggleMyTeam() {
    if (this.isHost) {
      const host = this.lobbyPlayers.find((p) => p.isHost);
      if (host) {
        host.team = host.team === 'green' ? 'purple' : 'green';
        this.myTeam = host.team;
        this.broadcastLobbyUpdate();
      }
    } else if (this.hostConnection && this.hostConnection.dc && this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(JSON.stringify({ type: 'TOGGLE_TEAM' }));
      } catch (e) {}
    }
  }

  broadcastLobbyUpdate() {
    if (!this.isHost) return;
    const packet = JSON.stringify({ type: 'LOBBY_UPDATE', players: this.lobbyPlayers });
    this.connections.forEach((conn) => {
      if (conn.dc && conn.dc.readyState === 'open') {
        try { conn.dc.send(packet); } catch (e) {}
      }
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
  }

  broadcastGameStart(seed = Date.now()) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'START_GAME',
      seed,
      players: this.lobbyPlayers
    });
    this.connections.forEach((conn) => {
      if (conn.dc && conn.dc.readyState === 'open') {
        try { conn.dc.send(packet); } catch (e) {}
      }
    });
  }

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'SNAPSHOT',
      snapshot
    });
    this.connections.forEach((conn) => {
      if (conn.dc && conn.dc.readyState === 'open') {
        try { conn.dc.send(packet); } catch (e) {}
      }
    });
  }

  broadcastGameOver(stats) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'GAME_OVER',
      stats
    });
    this.connections.forEach((conn) => {
      if (conn.dc && conn.dc.readyState === 'open') {
        try { conn.dc.send(packet); } catch (e) {}
      }
    });
  }

  // Disconnect & cleanup
  disconnect() {
    if (this.isHost && this.roomCode) {
      this.signaling.cleanupRoom(this.roomCode);
    } else if (this.roomCode && this.myPeerId) {
      this.signaling.cleanupGuestSignaling(this.roomCode, this.myPeerId);
    }

    if (this.connections) {
      this.connections.forEach((conn) => {
        try { conn.dc?.close(); } catch (e) {}
        try { conn.pc?.close(); } catch (e) {}
      });
      this.connections.clear();
    }

    if (this.hostConnection) {
      try { this.hostConnection.dc?.close(); } catch (e) {}
      try { this.hostConnection.pc?.close(); } catch (e) {}
      this.hostConnection = null;
    }

    this.isHost = false;
    this.lobbyPlayers = [];
  }
}

export const ghoulNet = new GhoulDuelNetworkManager();
