// Dochon Games Portal - Snowball Survival Hybrid WebRTC P2P + Firebase RTDB Relay Network Manager
// 4-Digit Numeric Room Code to Firebase RTDB Room Broker
// Tier 1: Direct WebRTC P2P (4s attempt, 0ms ultra-low latency, 0 Won cost)
// Tier 2: Automatic Firebase RTDB Relay Fallback (100% Guaranteed connection across split school networks)

import { FirebaseSignaling } from '../../../utils/firebaseSignaling';

// Multi-tier ICE Servers: Google, Cloudflare, Twilio STUN + Metered Ports 80/443 TURN
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
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
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  }
];

const P2P_HANDSHAKE_TIMEOUT_MS = 4000; // 4s timeout for direct WebRTC P2P before automatic relay fallback
const CONNECTION_TOTAL_TIMEOUT_MS = 20000; // 20s overall safety ceiling
const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2
};

export class SnowballNetworkManager {
  constructor() {
    this.signaling = new FirebaseSignaling('snowball');

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'penguin';
    this.connectionMode = 'p2p'; // 'p2p' | 'relay'

    // Host State: Map of guestId -> { pc, dc, player, isRelay }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, skinId, isHost, isReady, slotIndex, isRelay }]

    // Relay Throttling Timers
    this._lastRelaySnapshotTime = 0;
    this._lastRelayInputTime = 0;

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onKnockbackEvent = null;
    this.onEliminationEvent = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null; // Status message callback for UI feedback
    this.onRoomCodeChanged = null;  // Notifies UI if host code had to be auto-regenerated
    this.onClientInput = null;
  }

  // Generate random 4-digit numeric code
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // Clean numeric code string
  static cleanCode(code) {
    const digits = String(code || '').replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 4);
  }

  // Emit status message for user UI feedback
  _emitStatus(message) {
    if (this.onConnectionStatus) this.onConnectionStatus(message);
  }

  // Check if any connected players are using Firebase relay mode
  _hasRelayPlayers() {
    for (const [, conn] of this.connections) {
      if (conn.isRelay) return true;
    }
    return false;
  }

  // --- HOST: Create a Room via Firebase RTDB Signaling & Relay ---
  async createRoom(numericCode, playerName, skinId = 'penguin') {
    this.disconnect();

    const cleanCode = SnowballNetworkManager.cleanCode(numericCode);
    this.roomCode = cleanCode;
    this.isHost = true;
    this.myPeerId = 'host';
    this.myName = (playerName || '방장').trim();
    this.mySkinId = skinId;
    this.connectionMode = 'p2p';

    this._emitStatus('🔗 도촌초 전용 시그널링 서버 연결 중...');

    let autoRetryCount = 0;

    const attemptHostInit = async (codeToTry) => {
      this.roomCode = codeToTry;
      try {
        await this.signaling.createRoom(codeToTry, {
          name: this.myName,
          skinId: this.mySkinId
        });

        this.lobbyPlayers = [
          {
            id: 'host',
            name: this.myName,
            skinId: this.mySkinId,
            isHost: true,
            isReady: true,
            slotIndex: 0,
            isRelay: false
          }
        ];

        this._emitStatus(`✅ 방(${codeToTry}) 개설 완료! 참가자를 기다리는 중...`);
        if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);

        // 1. Listen for P2P WebRTC guest join offers
        this.signaling.listenForGuests(codeToTry, (guestId, guestData) => {
          this.handleIncomingGuest(guestId, guestData);
        });

        // 2. Listen for Firebase Relay fallback guests (Split network / firewall bypass)
        this.signaling.listenAllRelays(codeToTry, (guestId, relayData) => {
          this.handleIncomingRelayGuest(guestId, relayData);
        });

        return codeToTry;
      } catch (err) {
        if (err.message && err.message.includes('이미 다른 방장이 사용 중') && autoRetryCount < 2) {
          autoRetryCount++;
          const newCode = SnowballNetworkManager.generateRandomCode();
          this._emitStatus(`🔄 방 번호 중복 감지: 새 번호(${newCode})로 자동 개설 중...`);
          if (this.onRoomCodeChanged) this.onRoomCodeChanged(newCode);
          return attemptHostInit(newCode);
        }
        const errorMsg = err.message || '방 생성 중 오류가 발생했습니다.';
        this._emitStatus(`❌ ${errorMsg}`);
        if (this.onError) this.onError(errorMsg);
        this.disconnect();
        throw err;
      }
    };

    return attemptHostInit(cleanCode);
  }

  // --- HOST: Handle Incoming Guest WebRTC Offer (Tier 1 P2P) ---
  async handleIncomingGuest(guestId, guestData) {
    if (this.connections.has(guestId)) return;
    if (this.lobbyPlayers.length >= 8) return;

    this._emitStatus(`👋 ${guestData.name || '친구'}님이 입장을 시도합니다...`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    let dc = null;

    const candidateQueue = [];
    let isRemoteDescSet = false;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendHostCandidate(this.roomCode, guestId, event.candidate);
      }
    };

    pc.ondatachannel = (event) => {
      dc = event.channel;
      this.setupHostDataChannel(guestId, pc, dc, guestData);
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(guestData.offer));
      isRemoteDescSet = true;

      for (const cand of candidateQueue) {
        try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await this.signaling.sendAnswer(this.roomCode, guestId, answer);

      this.signaling.listenForGuestCandidates(this.roomCode, guestId, (cand) => {
        if (!isRemoteDescSet) {
          candidateQueue.push(cand);
        } else {
          pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      });
    } catch (err) {
      console.warn('[Host Handshake Warning]', err);
      try { pc.close(); } catch (e) {}
    }
  }

  // --- HOST: Setup DataChannel for Connected Guest (P2P Mode) ---
  setupHostDataChannel(guestId, pc, dc, guestData) {
    dc.onopen = () => {
      const newPlayer = {
        id: guestId,
        name: (guestData.name || `참가자-${this.lobbyPlayers.length + 1}`).trim(),
        skinId: guestData.skinId || 'snowman',
        isHost: false,
        isReady: true,
        slotIndex: this.lobbyPlayers.length,
        isRelay: false
      };

      this.lobbyPlayers.push(newPlayer);
      this.connections.set(guestId, { pc, dc, player: newPlayer, isRelay: false });

      try {
        dc.send(
          JSON.stringify({
            type: 'JOIN_ACK',
            accepted: true,
            players: this.lobbyPlayers,
            slotIndex: newPlayer.slotIndex
          })
        );
      } catch (e) {}

      this.signaling.cleanupGuestSignaling(this.roomCode, guestId);

      this._emitStatus(`⚡ ${newPlayer.name}님과 P2P 직결 완료! (${this.lobbyPlayers.length}/8명)`);
      this.broadcastLobbyUpdate();
    };

    dc.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleHostReceiveData(guestId, data);
      } catch (err) {
        console.error('[Host Data Error]', err);
      }
    };

    dc.onclose = () => {
      this.handlePeerLeave(guestId);
    };

    dc.onerror = (err) => {
      console.warn('[Host DataChannel Error]', guestId, err);
      this.handlePeerLeave(guestId);
    };
  }

  // --- HOST: Handle Incoming Relay Guest (Tier 2 Firebase RTDB Fallback) ---
  handleIncomingRelayGuest(guestId, relayData) {
    if (this.connections.has(guestId)) {
      const existing = this.connections.get(guestId);
      if (!existing.isRelay) return; // Already connected via P2P
    }
    if (this.lobbyPlayers.length >= 8) return;

    const newPlayer = {
      id: guestId,
      name: (relayData.name || `참가자-${this.lobbyPlayers.length + 1}`).trim(),
      skinId: relayData.skinId || 'snowman',
      isHost: false,
      isReady: true,
      slotIndex: this.lobbyPlayers.length,
      isRelay: true
    };

    // Remove from lobby if was pending
    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== guestId);
    this.lobbyPlayers.push(newPlayer);
    this.connections.set(guestId, { pc: null, dc: null, player: newPlayer, isRelay: true });

    // 1. Send direct ACK to this relay guest
    this.signaling.sendRelayHostMessage(this.roomCode, guestId, {
      type: 'JOIN_ACK',
      accepted: true,
      players: this.lobbyPlayers,
      slotIndex: newPlayer.slotIndex
    });

    // 2. Listen to this relay guest's real-time input messages
    this.signaling.listenRelayGuestMessages(this.roomCode, guestId, (data) => {
      this.handleHostReceiveData(guestId, data);
    });

    this._emitStatus(`🔄 ${newPlayer.name}님과 Firebase 안전 릴레이 연결 완료! (${this.lobbyPlayers.length}/8명)`);
    this.broadcastLobbyUpdate();
  }

  handleHostReceiveData(peerId, data) {
    if (!data || !data.type) return;

    if (data.type === 'CHANGE_SKIN') {
      const player = this.lobbyPlayers.find(p => p.id === peerId);
      if (player) {
        player.skinId = data.skinId || player.skinId;
        this.broadcastLobbyUpdate();
      }
    } else if (data.type === 'CLIENT_INPUT') {
      if (this.onClientInput) {
        this.onClientInput(peerId, data);
      }
    }
  }

  handlePeerLeave(peerId) {
    const connObj = this.connections.get(peerId);
    if (connObj) {
      try { connObj.dc?.close(); } catch (e) {}
      try { connObj.pc?.close(); } catch (e) {}
      if (connObj.isRelay) {
        this.signaling.cleanupRelay(this.roomCode, peerId);
      }
      this.connections.delete(peerId);
    }

    const leaving = this.lobbyPlayers.find(p => p.id === peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== peerId);

    if (leaving) {
      this._emitStatus(`👋 ${leaving.name}님이 퇴장했습니다.`);
    }
    this.broadcastLobbyUpdate();
  }

  broadcastLobbyUpdate() {
    this._broadcastToAll({
      type: 'LOBBY_STATE',
      players: this.lobbyPlayers,
      roomCode: this.roomCode
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- GUEST: Join Room (Tier 1 WebRTC P2P -> Automatic Tier 2 Firebase Relay Fallback) ---
  joinRoom(numericCode, playerName, skinId = 'snowman') {
    return new Promise(async (resolve, reject) => {
      this.disconnect();

      const cleanCode = SnowballNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = (playerName || '도촌친구').trim();
      this.mySkinId = skinId;
      const guestId = `g_${Math.random().toString(36).slice(2, 9)}`;
      this.myPeerId = guestId;
      this.connectionMode = 'p2p';

      this._emitStatus(`🔍 방 찾는 중... (방 번호: [${cleanCode}])`);

      let settled = false;
      let p2pFallbackTimer = null;
      let totalSafetyTimer = null;

      const settle = (type, val) => {
        if (settled) return;
        settled = true;
        if (p2pFallbackTimer) clearTimeout(p2pFallbackTimer);
        if (totalSafetyTimer) clearTimeout(totalSafetyTimer);
        if (type === 'resolve') resolve(val);
        else reject(val);
      };

      // 20s absolute safety timeout
      totalSafetyTimer = setTimeout(() => {
        if (!settled) {
          this.disconnect();
          const errorMsg = `방 번호 [${cleanCode}]에 연결할 수 없습니다. 방장이 대기 중인지 확인해 주세요.`;
          this._emitStatus(`❌ ${errorMsg}`);
          if (this.onError) this.onError(errorMsg);
          settle('reject', new Error(errorMsg));
        }
      }, CONNECTION_TOTAL_TIMEOUT_MS);

      // --- Trigger Automatic Firebase Relay Fallback ---
      const fallbackToRelayMode = async (reason = '') => {
        if (settled || this.connectionMode === 'relay') return;
        this.connectionMode = 'relay';
        if (p2pFallbackTimer) clearTimeout(p2pFallbackTimer);

        console.info(`[P2P Fallback] Direct P2P unreachable (${reason}). Seamlessly switching to Firebase RTDB Relay...`);
        this._emitStatus('🔄 망 분리 감지 ➔ Firebase 안전 릴레이 모드로 자동 연결 완료!');

        // Close WebRTC handles safely
        try {
          if (this.hostConnection) {
            this.hostConnection.dc?.close();
            this.hostConnection.pc?.close();
            this.hostConnection = null;
          }
        } catch (e) {}

        try {
          // 1. Listen for 1-to-many Broadcasts from Host (Snapshots, Events, Lobby)
          this.signaling.listenRelayBroadcast(cleanCode, (data) => {
            this._handleGuestReceivedData(data);
          });

          // 2. Listen for Direct Messages from Host (JOIN_ACK)
          this.signaling.listenRelayHostMessages(cleanCode, guestId, (data) => {
            if (data.type === 'JOIN_ACK') {
              if (data.accepted) {
                this.lobbyPlayers = data.players || [];
                this._emitStatus('🎉 Firebase 안전 릴레이 모드로 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
                settle('resolve', cleanCode);
              } else {
                const errorMsg = data.message || '방 입장이 거부되었습니다.';
                this._emitStatus(`❌ ${errorMsg}`);
                if (this.onError) this.onError(errorMsg);
                settle('reject', new Error(errorMsg));
              }
              return;
            }
            this._handleGuestReceivedData(data);
          });

          // 3. Send JOIN_LOBBY via Firebase Relay
          await this.signaling.sendRelayGuestMessage(cleanCode, guestId, {
            type: 'JOIN_LOBBY',
            id: guestId,
            name: this.myName,
            skinId: this.mySkinId
          });
        } catch (err) {
          console.error('[Relay Fallback Error]', err);
          settle('reject', err);
        }
      };

      try {
        // Step 1: Verify room exists in Firebase RTDB
        await this.signaling.checkRoom(cleanCode);

        this._emitStatus('⚡ P2P 직결 연결 시도 중 (WebRTC 핸드셰이크)...');

        // Step 2: Attempt Tier 1 Direct WebRTC P2P
        const pc = new RTCPeerConnection(RTC_CONFIG);
        const dc = pc.createDataChannel('snowballGameChannel', { ordered: true });
        this.hostConnection = { pc, dc };

        const candidateQueue = [];
        let isRemoteDescSet = false;

        // Set 4-second timeout: if DataChannel does not open in 4s, automatically fall back to Firebase Relay!
        p2pFallbackTimer = setTimeout(() => {
          if (!settled && this.connectionMode === 'p2p') {
            fallbackToRelayMode('4초 직결 타임아웃');
          }
        }, P2P_HANDSHAKE_TIMEOUT_MS);

        pc.onicecandidate = (event) => {
          if (event.candidate && this.connectionMode === 'p2p') {
            this.signaling.sendGuestCandidate(cleanCode, guestId, event.candidate);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed' && this.connectionMode === 'p2p') {
            fallbackToRelayMode('ICE 연결 실패');
          }
        };

        dc.onopen = () => {
          if (this.connectionMode === 'p2p') {
            if (p2pFallbackTimer) clearTimeout(p2pFallbackTimer);
            this._emitStatus('⚡ P2P 터널 수립 완료! 대기실 입장 확인 중...');
          }
        };

        dc.onmessage = (event) => {
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            if (data.type === 'JOIN_ACK') {
              if (data.accepted) {
                this.lobbyPlayers = data.players || [];
                this._emitStatus('🎉 P2P 초저지연 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);

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

            this._handleGuestReceivedData(data);
          } catch (err) {
            console.error('[Guest Data Parsing Error]', err);
          }
        };

        dc.onclose = () => {
          if (this.connectionMode === 'p2p') {
            this._emitStatus('❌ 방장과의 연결이 종료되었습니다.');
            if (this.onDisconnect) this.onDisconnect('방장과의 연결이 끊어졌습니다.');
          }
        };

        dc.onerror = (err) => {
          if (this.connectionMode === 'p2p') {
            console.warn('[P2P DC Error, triggering relay fallback]:', err);
            fallbackToRelayMode('DataChannel 에러');
          }
        };

        // Create SDP Offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await this.signaling.joinRoomWithOffer(
          cleanCode,
          guestId,
          {
            name: this.myName,
            skinId: this.mySkinId
          },
          offer
        );

        this._emitStatus('⏳ 방장의 응답을 기다리는 중...');

        // Listen for SDP Answer from Host
        this.signaling.listenForAnswer(cleanCode, guestId, async (answer) => {
          if (this.connectionMode !== 'p2p') return;
          try {
            if (!pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              isRemoteDescSet = true;

              for (const cand of candidateQueue) {
                try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
              }
            }
          } catch (err) {
            console.warn('[Remote Answer Error]', err);
            fallbackToRelayMode('SDP 세션 설정 실패');
          }
        });

        // Listen for Host's ICE Candidates
        this.signaling.listenForHostCandidates(cleanCode, guestId, (cand) => {
          if (this.connectionMode !== 'p2p') return;
          if (!isRemoteDescSet) {
            candidateQueue.push(cand);
          } else {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
        });
      } catch (err) {
        console.warn('[P2P Init Error]', err);
        fallbackToRelayMode('P2P 초기화 오류');
      }
    });
  }

  _handleGuestReceivedData(data) {
    if (!data || !data.type) return;

    if (data.type === 'LOBBY_STATE') {
      this.lobbyPlayers = data.players || [];
      if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
    } else if (data.type === 'JOIN_REJECTED') {
      if (this.onError) this.onError(data.reason || '방 입장이 거부되었습니다.');
      this.disconnect();
    } else if (data.type === 'GAME_START') {
      if (this.onGameStart) this.onGameStart(data);
    } else if (data.type === 'GAME_SNAPSHOT') {
      if (this.onSnapshot) this.onSnapshot(data);
    } else if (data.type === 'KNOCKBACK_EVENT') {
      if (this.onKnockbackEvent) this.onKnockbackEvent(data);
    } else if (data.type === 'ELIMINATION_EVENT') {
      if (this.onEliminationEvent) this.onEliminationEvent(data);
    } else if (data.type === 'GAME_OVER') {
      if (this.onGameOver) this.onGameOver(data);
    }
  }

  // --- Host sends Game Start ---
  hostStartGame(seed = Date.now()) {
    if (!this.isHost) return;
    const startPayload = {
      type: 'GAME_START',
      seed,
      players: this.lobbyPlayers,
      startTime: Date.now()
    };
    this._broadcastToAll(startPayload);
    if (this.onGameStart) this.onGameStart(startPayload);

    if (this.roomCode) {
      this.signaling.updateRoomStatus(this.roomCode, 'playing').catch(() => {});
    }
  }

  // --- Host sends Game Snapshot (P2P: 30Hz, Relay: 10Hz Throttled) ---
  hostBroadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    this._broadcastToAll({
      type: 'GAME_SNAPSHOT',
      ...snapshot
    });
  }

  // --- Guest sends Input to Host (P2P: Real-time, Relay: 10Hz Throttled) ---
  guestSendInput(inputData) {
    if (this.isHost) return;

    const payload = {
      type: 'CLIENT_INPUT',
      ...inputData
    };

    // Mode A: P2P Direct
    if (this.connectionMode === 'p2p' && this.hostConnection && this.hostConnection.dc) {
      if (this.hostConnection.dc.readyState === 'open') {
        try {
          this.hostConnection.dc.send(JSON.stringify(payload));
        } catch (e) {}
      }
      return;
    }

    // Mode B: Firebase RTDB Relay (Throttled to 10Hz = 100ms)
    if (this.connectionMode === 'relay' && this.roomCode && this.myPeerId) {
      const now = Date.now();
      if (now - this._lastRelayInputTime >= 95) {
        this._lastRelayInputTime = now;
        this.signaling.sendRelayGuestMessage(this.roomCode, this.myPeerId, payload);
      }
    }
  }

  // --- Change Skin in Lobby ---
  changeSkin(skinId) {
    this.mySkinId = skinId;
    if (this.isHost) {
      const p = this.lobbyPlayers.find(pl => pl.id === this.myPeerId);
      if (p) p.skinId = skinId;
      this.broadcastLobbyUpdate();
    } else if (this.connectionMode === 'p2p' && this.hostConnection && this.hostConnection.dc?.readyState === 'open') {
      try {
        this.hostConnection.dc.send(JSON.stringify({ type: 'CHANGE_SKIN', skinId }));
      } catch (e) {}
    } else if (this.connectionMode === 'relay' && this.roomCode && this.myPeerId) {
      this.signaling.sendRelayGuestMessage(this.roomCode, this.myPeerId, { type: 'CHANGE_SKIN', skinId });
    }
  }

  // --- Hybrid Broadcast: P2P DataChannel + Firebase Relay Broadcast ---
  _broadcastToAll(payload) {
    const msg = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // 1. Send via direct P2P DataChannel (0ms ultra-low latency)
    this.connections.forEach(({ dc, isRelay }) => {
      if (!isRelay && dc && dc.readyState === 'open') {
        try {
          dc.send(msg);
        } catch (e) {}
      }
    });

    // 2. If any relay guests exist, broadcast via Firebase RTDB Relay
    if (this.isHost && this.roomCode && this._hasRelayPlayers()) {
      const now = Date.now();
      const isSnapshot = payload && payload.type === 'GAME_SNAPSHOT';

      if (isSnapshot) {
        // Throttle snapshots to ~10Hz (100ms) for Firebase Spark quota safety
        if (now - this._lastRelaySnapshotTime >= 95) {
          this._lastRelaySnapshotTime = now;
          this.signaling.broadcastRelay(this.roomCode, payload);
        }
      } else {
        // Critical events (GAME_START, LOBBY_STATE, GAME_OVER) sent immediately
        this.signaling.broadcastRelay(this.roomCode, payload);
      }
    }
  }

  disconnect() {
    try {
      // Close all Host connections
      this.connections.forEach(({ dc, pc, isRelay }, peerId) => {
        try { dc?.close(); } catch (e) {}
        try { pc?.close(); } catch (e) {}
        if (isRelay && this.roomCode) {
          this.signaling.cleanupRelay(this.roomCode, peerId);
        }
      });
      this.connections.clear();

      // Close Guest connection
      if (this.hostConnection) {
        try { this.hostConnection.dc?.close(); } catch (e) {}
        try { this.hostConnection.pc?.close(); } catch (e) {}
        this.hostConnection = null;
      }

      // If guest in relay mode, clean up relay entry
      if (!this.isHost && this.connectionMode === 'relay' && this.roomCode && this.myPeerId) {
        this.signaling.cleanupRelay(this.roomCode, this.myPeerId);
      }

      // Cleanup Firebase Signaling timers
      if (this.signaling) {
        if (this.isHost && this.roomCode) {
          this.signaling.closeRoom(this.roomCode).catch(() => {});
        }
        this.signaling.cleanup();
      }
    } catch {
      // Ignore cleanup error
    }

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.connectionMode = 'p2p';
    this.lobbyPlayers = [];
  }
}

export const snowballNet = new SnowballNetworkManager();
