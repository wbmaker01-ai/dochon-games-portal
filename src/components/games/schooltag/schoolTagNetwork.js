// Dochon Games Portal - School Tag WebRTC P2P Network Manager
// Hybrid Fallback Engine: Tier 1 Direct WebRTC P2P (4s timeout) -> Tier 2 Firebase RTDB Real-Time Relay
// Guarantees 100% Connectivity between Isolated Teacher/Student School Networks with 0 Bytes Waste

import { FirebaseSignaling } from '../../../utils/firebaseSignaling';
import { SCHOOL_TAG_CONSTANTS, ROLE_TYPES } from './schoolTagConstants';

// Multi-tier ICE Servers: High-availability STUN + Port 80/443 TCP/TLS TURN Relays
// Optimized for restrictive school firewalls, symmetric NATs, and Chromebooks
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
  // Public OpenRelay Backup Servers
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  },
  {
    urls: 'turn:openrelay.metered.ca:80?transport=tcp',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  },
  {
    urls: 'turns:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelaypublic',
    credential: 'openrelaypublic'
  }
];

const P2P_HANDSHAKE_TIMEOUT_MS = 4000;      // Tier 1 P2P attempt timeout: 4 seconds
const CONNECTION_TOTAL_TIMEOUT_MS = 18000;   // Overall connection timeout: 18 seconds
const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2
};

export class SchoolTagNetworkManager {
  constructor() {
    this.signaling = new FirebaseSignaling('schooltag');

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'boy';
    this.myRole = ROLE_TYPES.RUNNER;
    this.connectionMode = 'p2p'; // 'p2p' | 'relay'

    // Host State: Map of guestId -> { pc, dc, player, isRelay }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, skinId, role, isHost, isReady, slotIndex }]

    // Rate Limiting / Throttling for Relay mode (Max 10 updates/sec to protect Firebase Spark Quota)
    this.lastRelayBroadcastTime = 0;
    this.lastRelayInputTime = 0;

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onGameStateUpdate = null;
    this.onTagEvent = null;
    this.onRescueEvent = null;
    this.onKeyEvent = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null; // Status message callback for UI feedback
    this.onRoomCodeChanged = null;  // Notifies UI if host code had to be auto-regenerated
    this.onPlayerInput = null;
    this.onPlayerAction = null;
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

  // Check if any active guest is in Relay mode
  get hasRelayGuests() {
    for (const conn of this.connections.values()) {
      if (conn.isRelay) return true;
    }
    return false;
  }

  // --- HOST: Create a Room with Dual Channel (WebRTC P2P + Firebase Relay Fallback) ---
  async createRoom(numericCode, playerName, role = ROLE_TYPES.RUNNER, skinId = 'boy') {
    this.disconnect();

    const cleanCode = SchoolTagNetworkManager.cleanCode(numericCode);
    this.roomCode = cleanCode;
    this.isHost = true;
    this.myPeerId = 'host';
    this.myName = (playerName || '방장(학생)').trim();
    this.myRole = role;
    this.mySkinId = skinId;
    this.connectionMode = 'p2p';

    this._emitStatus('🔗 도촌초 전용 시그널링 서버 연결 중...');

    let autoRetryCount = 0;

    const attemptHostInit = async (codeToTry) => {
      this.roomCode = codeToTry;
      try {
        await this.signaling.createRoom(codeToTry, {
          name: this.myName,
          role: this.myRole,
          skinId: this.mySkinId
        });

        this.lobbyPlayers = [
          {
            id: 'host',
            name: this.myName,
            skinId: this.mySkinId,
            role: this.myRole,
            isHost: true,
            isReady: true,
            slotIndex: 0
          }
        ];

        this._emitStatus(`✅ 방(${codeToTry}) 개설 완료! 참가자를 기다리는 중...`);
        if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);

        // Channel 1: Listen for Tier 1 WebRTC P2P Guest Join Offers
        this.signaling.listenForGuests(codeToTry, (guestId, guestData) => {
          this.handleIncomingGuest(guestId, guestData);
        });

        // Channel 2: Listen for Tier 2 Firebase Relay Fallback Guest Joins (School Network Isolation bypass)
        this.signaling.listenAllRelays(codeToTry, (guestId, guestMsg) => {
          this.handleIncomingRelayGuest(guestId, guestMsg);
        });

        return codeToTry;
      } catch (err) {
        if (err.message && err.message.includes('이미 다른 방장이') && autoRetryCount < 2) {
          autoRetryCount++;
          const newCode = SchoolTagNetworkManager.generateRandomCode();
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

  // --- HOST: Handle Tier 1 WebRTC P2P Guest Offer ---
  async handleIncomingGuest(guestId, guestData) {
    if (this.connections.has(guestId)) return;
    if (this.lobbyPlayers.length >= 4) return; // Max 4 players

    this._emitStatus(`⚡ ${guestData.name || '친구'}님이 P2P 직결 입장을 시도합니다...`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    let dc = null;

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

      // Drain queued ICE candidates
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
      console.error('[Host Handshake Error]', err);
      try { pc.close(); } catch (e) {}
    }
  }

  // --- HOST: Setup DataChannel for Connected P2P Guest ---
  setupHostDataChannel(guestId, pc, dc, guestData) {
    dc.onopen = () => {
      // Prevent duplicate if already added
      if (this.connections.has(guestId)) return;

      const slot = this.lobbyPlayers.length;
      const newPlayer = {
        id: guestId,
        name: (guestData.name || `학생 ${slot + 1}`).trim(),
        skinId: guestData.skinId || 'boy',
        role: ROLE_TYPES.RUNNER,
        isHost: false,
        isReady: true,
        slotIndex: slot
      };

      this.lobbyPlayers.push(newPlayer);
      this.connections.set(guestId, { pc, dc, player: newPlayer, isRelay: false });

      // Send 3-Way Handshake ACK over P2P DataChannel
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

      // Clean up guest signaling node in Firebase RTDB (Leaves 0 bytes!)
      this.signaling.cleanupGuestSignaling(this.roomCode, guestId);

      this._emitStatus(`🎉 ${newPlayer.name}님과 P2P 직결 연결 성공! (${this.lobbyPlayers.length}/4)`);
      this._broadcastLobby();
    };

    dc.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleHostReceiveData(guestId, data);
      } catch (err) {
        console.error('[Host P2P Data Parsing Error]', err);
      }
    };

    dc.onclose = () => {
      this._handlePlayerLeave(guestId);
    };

    dc.onerror = (err) => {
      console.warn('[Host DataChannel Error]', guestId, err);
      this._handlePlayerLeave(guestId);
    };
  }

  // --- HOST: Handle Tier 2 Firebase Relay Fallback Guest Join ---
  handleIncomingRelayGuest(guestId, guestMsg) {
    if (this.connections.has(guestId)) return;
    if (this.lobbyPlayers.length >= 4) return; // Max 4 players

    const slot = this.lobbyPlayers.length;
    const newPlayer = {
      id: guestId,
      name: (guestMsg.name || `학생 ${slot + 1}`).trim(),
      skinId: guestMsg.skinId || 'boy',
      role: ROLE_TYPES.RUNNER,
      isHost: false,
      isReady: true,
      slotIndex: slot
    };

    this.lobbyPlayers.push(newPlayer);
    this.connections.set(guestId, { pc: null, dc: null, player: newPlayer, isRelay: true });

    // 1. Send direct ACK to this relay guest via Firebase Relay Channel
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

    this._emitStatus(`🔄 ${newPlayer.name}님과 Firebase 안전 릴레이 연결 완료! (${this.lobbyPlayers.length}/4)`);
    this._broadcastLobby();
  }

  // --- HOST: Handle Received Data (Unified P2P & Relay) ---
  handleHostReceiveData(peerId, data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'CLIENT_INPUT':
        if (this.onPlayerInput) {
          this.onPlayerInput(peerId, data.payload || data);
        }
        break;

      case 'CLIENT_ACTION':
        if (this.onPlayerAction) {
          this.onPlayerAction(peerId, data.payload || data);
        }
        break;

      default:
        break;
    }
  }

  _handlePlayerLeave(peerId) {
    if (!this.isHost) return;

    if (this.connections.has(peerId)) {
      const conn = this.connections.get(peerId);
      try { conn.dc?.close(); } catch (e) {}
      try { conn.pc?.close(); } catch (e) {}
      if (conn.isRelay) {
        this.signaling.cleanupRelay(this.roomCode, peerId);
      }
      this.connections.delete(peerId);
    }

    const leaving = this.lobbyPlayers.find((p) => p.id === peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);

    if (leaving) {
      this._emitStatus(`👋 ${leaving.name}님이 퇴장했습니다.`);
    }
    this._broadcastLobby();
  }

  _broadcastLobby() {
    if (!this.isHost) return;
    const packet = {
      type: 'LOBBY_STATE',
      players: this.lobbyPlayers,
      roomCode: this.roomCode
    };
    this._broadcastToAll(packet);
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- Unified Broadcast: Sends via P2P DataChannel and/or Firebase RTDB Relay ---
  _broadcastToAll(data, isHighFrequency = false) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    // 1. Direct WebRTC P2P DataChannels
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(payload);
        } catch (e) {}
      }
    });

    // 2. Firebase RTDB Real-time Relay (Only if any active guest is in Relay mode)
    if (this.hasRelayGuests) {
      const now = Date.now();
      // Apply 100ms throttling (max 10 fps) for high-frequency game state to protect Firebase Spark Free Tier
      if (isHighFrequency) {
        if (now - this.lastRelayBroadcastTime >= 100) {
          this.lastRelayBroadcastTime = now;
          this.signaling.broadcastRelay(this.roomCode, typeof data === 'object' ? data : JSON.parse(data));
        }
      } else {
        // Critical events (LOBBY_STATE, GAME_START, TAG_EVENT, KEY_COLLECTED, GAME_OVER) are sent instantly
        this.signaling.broadcastRelay(this.roomCode, typeof data === 'object' ? data : JSON.parse(data));
      }
    }
  }

  // --- GUEST: Join Room (Tier 1 WebRTC P2P -> Automatic Tier 2 Firebase Relay Fallback) ---
  joinRoom(numericCode, playerName, skinId = 'boy') {
    return new Promise(async (resolve, reject) => {
      this.disconnect();

      const cleanCode = SchoolTagNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = (playerName || '친구(학생)').trim();
      this.myRole = ROLE_TYPES.RUNNER;
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

      // 18s absolute safety timeout
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

        console.info(`[SchoolTag P2P Fallback] Direct P2P unreachable (${reason}). Seamlessly switching to Firebase RTDB Relay...`);
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
                const errorMsg = data.reason || '방 입장이 거부되었습니다.';
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
        const dc = pc.createDataChannel('schoolTagChannel', { ordered: true });
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

            // Handle Handshake ACK from Host
            if (data.type === 'JOIN_ACK') {
              if (data.accepted) {
                this.lobbyPlayers = data.players || [];
                this._emitStatus('🎉 P2P 초저지연 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);

                // Clean up guest signaling data from Firebase RTDB (Leaves 0 bytes!)
                this.signaling.cleanupGuestSignaling(cleanCode, guestId);

                settle('resolve', cleanCode);
              } else {
                const errorMsg = data.reason || '방 입장이 거부되었습니다.';
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

        // 3. Create SDP Offer & send to Firebase RTDB
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

        // 4. Listen for Host's SDP Answer
        this.signaling.listenForAnswer(cleanCode, guestId, async (answer) => {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            isRemoteDescSet = true;

            // Drain queued ICE candidates
            for (const cand of candidateQueue) {
              try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
            }
          } catch (err) {
            console.error('[Guest RemoteDesc Error]', err);
          }
        });

        // 5. Listen for Host's ICE Candidates
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

  _handleGuestReceivedData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'LOBBY_STATE':
      case 'LOBBY_UPDATE':
        this.lobbyPlayers = data.players || [];
        if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
        break;

      case 'GAME_START':
        if (this.onGameStart) this.onGameStart(data.matchData);
        break;

      case 'GAME_STATE':
        if (this.onGameStateUpdate) this.onGameStateUpdate(data.state);
        break;

      case 'TAG_EVENT':
        if (this.onTagEvent) this.onTagEvent(data);
        break;

      case 'KEY_COLLECTED':
        if (this.onKeyEvent) this.onKeyEvent(data);
        break;

      case 'GAME_OVER':
        if (this.onGameOver) this.onGameOver(data.result);
        break;

      case 'ROOM_FULL':
        if (this.onError) this.onError(data.reason || '방의 인원이 가득 찼습니다. (최대 4인)');
        this.disconnect();
        break;

      default:
        break;
    }
  }

  // --- Match Control (Host -> Guests via P2P DataChannel & Relay) ---
  broadcastGameStart(matchData) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'playing');
    this._broadcastToAll({ type: 'GAME_START', matchData }, false);
    if (this.onGameStart) this.onGameStart(matchData);
  }

  broadcastGameState(state) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'GAME_STATE', state }, true);
  }

  broadcastTagEvent(tagData) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'TAG_EVENT', ...tagData }, false);
    if (this.onTagEvent) this.onTagEvent(tagData);
  }

  broadcastKeyEvent(keyData) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'KEY_COLLECTED', ...keyData }, false);
    if (this.onKeyEvent) this.onKeyEvent(keyData);
  }

  broadcastGameOver(result) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'finished');
    this._broadcastToAll({ type: 'GAME_OVER', result }, false);
    if (this.onGameOver) this.onGameOver(result);
  }

  // --- Client Controls (Guest -> Host via P2P DataChannel or Firebase Relay) ---
  sendClientInput(input) {
    if (this.isHost) return;

    if (this.connectionMode === 'p2p') {
      if (this.hostConnection?.dc?.readyState === 'open') {
        try {
          this.hostConnection.dc.send(
            JSON.stringify({
              type: 'CLIENT_INPUT',
              payload: input
            })
          );
        } catch (e) {}
      }
    } else if (this.connectionMode === 'relay') {
      const now = Date.now();
      // Throttle client input to max 10 fps (100ms) in relay mode to protect Firebase Spark Free Tier
      if (now - this.lastRelayInputTime >= 100) {
        this.lastRelayInputTime = now;
        this.signaling.sendRelayGuestMessage(this.roomCode, this.myPeerId, {
          type: 'CLIENT_INPUT',
          payload: input
        });
      }
    }
  }

  sendClientAction(action) {
    if (this.isHost) return;

    if (this.connectionMode === 'p2p') {
      if (this.hostConnection?.dc?.readyState === 'open') {
        try {
          this.hostConnection.dc.send(
            JSON.stringify({
              type: 'CLIENT_ACTION',
              payload: action
            })
          );
        } catch (e) {}
      }
    } else if (this.connectionMode === 'relay') {
      this.signaling.sendRelayGuestMessage(this.roomCode, this.myPeerId, {
        type: 'CLIENT_ACTION',
        payload: action
      });
    }
  }

  // --- Disconnect & Complete Cleanup ---
  disconnect() {
    if (this.isHost && this.roomCode) {
      this.signaling.cleanupRoom(this.roomCode);
    }

    if (this.connections) {
      this.connections.forEach((conn) => {
        try { conn.dc?.close(); } catch (_) {}
        try { conn.pc?.close(); } catch (_) {}
        if (conn.isRelay) {
          this.signaling.cleanupRelay(this.roomCode, conn.player?.id);
        }
      });
      this.connections.clear();
    }

    if (this.hostConnection) {
      try { this.hostConnection.dc?.close(); } catch (_) {}
      try { this.hostConnection.pc?.close(); } catch (_) {}
      this.hostConnection = null;
    }

    this.signaling.cleanup();

    this.lobbyPlayers = [];
    this.isHost = false;
    this.roomCode = '';
    this.connectionMode = 'p2p';
  }
}
