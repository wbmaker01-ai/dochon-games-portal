// Dochon Games Portal - Dochon Pirate Coin Heist WebRTC P2P Network Manager
// Hybrid Fallback Engine: Tier 1 Direct WebRTC P2P (4s timeout) -> Tier 2 Firebase RTDB Real-Time Relay
// Guarantees 100% Connectivity between Isolated Teacher/Student School Networks with 0 Bytes Waste

import { FirebaseSignaling } from '../../../utils/firebaseSignaling';

// Multi-tier ICE Servers: Google, Cloudflare STUN + Ports 80/443 Relay TURN
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
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

const P2P_HANDSHAKE_TIMEOUT_MS = 4000;      // Tier 1 P2P attempt timeout: 4 seconds
const CONNECTION_TOTAL_TIMEOUT_MS = 18000;   // Overall connection timeout: 18 seconds
const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2
};

export class PirateCoinNetworkManager {
  constructor() {
    this.signaling = new FirebaseSignaling('piratecoin');

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.myShipClass = 'caravel';
    this.myTeamId = 0;
    this.connectionMode = 'p2p'; // 'p2p' | 'relay'

    // Host State: Map of guestId -> { pc, dc, player, isRelay, info }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, shipClass, teamId, isHost, isReady, isRelay }]

    // Rate Limiting / Throttling for Relay mode (Max 10 updates/sec to protect Firebase Spark Quota)
    this.lastRelayBroadcastTime = 0;
    this.lastRelayInputTime = 0;

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onClientInput = null;
    this.onEventPacket = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null;
    this.onRoomCodeChanged = null;
  }

  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  static cleanCode(code) {
    const digits = String(code || '').replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 4);
  }

  emitStatus(msg) {
    if (this.onConnectionStatus) this.onConnectionStatus(msg);
  }

  // --- Host: Create Room in Firebase RTDB ---
  async createHostRoom(numericCode, hostName, shipClass = 'caravel') {
    this.destroy();
    this.isHost = true;
    this.myName = (hostName || '방장 선장').trim();
    this.myShipClass = shipClass;
    this.myTeamId = 0; // Host is always Team 0 (Red)
    this.myPeerId = 'host';
    this.connectionMode = 'p2p';

    let cleanCode = PirateCoinNetworkManager.cleanCode(numericCode);
    if (!cleanCode || cleanCode.length !== 4) {
      cleanCode = PirateCoinNetworkManager.generateRandomCode();
    }

    this.emitStatus(`시그널링 브로커 연결 중... (방 코드: ${cleanCode})`);

    try {
      try {
        await this.signaling.createRoom(cleanCode, {
          name: this.myName,
          shipClass: this.myShipClass,
          teamId: 0
        });
      } catch (err) {
        if (err.message && err.message.includes('이미 다른 방장이')) {
          cleanCode = PirateCoinNetworkManager.generateRandomCode();
          if (this.onRoomCodeChanged) this.onRoomCodeChanged(cleanCode);
          await this.signaling.createRoom(cleanCode, {
            name: this.myName,
            shipClass: this.myShipClass,
            teamId: 0
          });
        } else {
          throw err;
        }
      }

      this.roomCode = cleanCode;
      this.lobbyPlayers = [
        {
          id: 'host',
          name: this.myName,
          shipClass: this.myShipClass,
          teamId: 0,
          isHost: true,
          isReady: true,
          isRelay: false
        }
      ];

      this._notifyLobby();
      this.emitStatus(`방 [${cleanCode}] 생성 완료! 선원 대기 중...`);

      // Channel 1: Listen for incoming Tier 1 P2P guest join offers
      this.signaling.listenForGuests(cleanCode, async (guestId, guestData) => {
        if (this.connections.size >= 3) return; // Max 4 players
        await this._handleIncomingGuest(cleanCode, guestId, guestData);
      });

      // Channel 2: Listen for Tier 2 Firebase Relay Fallback Guest Joins
      this.signaling.listenAllRelays(cleanCode, (guestId, guestMsg) => {
        this._handleIncomingRelayGuest(cleanCode, guestId, guestMsg);
      });

      return cleanCode;
    } catch (err) {
      this.emitStatus(`방 생성 실패: ${err.message}`);
      if (this.onError) this.onError(err);
      throw err;
    }
  }

  // --- Host: Handle Incoming Guest Offer (Tier 1 P2P) ---
  async _handleIncomingGuest(roomCode, guestId, guestData) {
    if (this.connections.has(guestId)) return;

    this.emitStatus(`${guestData.name || '새 선원'} P2P 핸드셰이크 연결 중...`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const connObj = { pc, dc: null, guestId, isRelay: false, info: guestData };
    this.connections.set(guestId, connObj);

    // Assign team slot 1, 2, or 3
    const usedTeams = new Set(this.lobbyPlayers.map((p) => p.teamId));
    let assignedTeam = 1;
    for (let t = 1; t < 4; t++) {
      if (!usedTeams.has(t)) {
        assignedTeam = t;
        break;
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendHostCandidate(roomCode, guestId, event.candidate);
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      connObj.dc = dc;
      this._setupHostDataChannel(dc, guestId);
    };

    this.signaling.listenForGuestCandidates(roomCode, guestId, (cand) => {
      try {
        pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
      } catch (e) {}
    });

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(guestData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await this.signaling.sendAnswer(roomCode, guestId, answer);

      // Add to lobby
      const newPlayer = {
        id: guestId,
        name: guestData.name || `해적 ${guestId.slice(-3)}`,
        shipClass: guestData.shipClass || 'cutter',
        teamId: assignedTeam,
        isHost: false,
        isReady: true,
        isRelay: false
      };
      this.lobbyPlayers.push(newPlayer);
      connObj.player = newPlayer;

      this._notifyLobby();
      this.broadcastLobbyState();
    } catch (err) {
      this.connections.delete(guestId);
      console.error('[Pirate Host Handshake Error]', err);
    }
  }

  // --- Host: Handle Incoming Relay Guest (Tier 2 Fallback) ---
  _handleIncomingRelayGuest(roomCode, guestId, guestMsg) {
    if (this.connections.has(guestId)) {
      const existing = this.connections.get(guestId);
      if (!existing.isRelay) return; // Already on P2P
    }
    if (this.connections.size >= 3) return; // Max 4 players

    console.info(`[Pirate Relay Host] Guest ${guestId} joined via Firebase RTDB Relay`);

    const usedTeams = new Set(this.lobbyPlayers.map((p) => p.teamId));
    let assignedTeam = 1;
    for (let t = 1; t < 4; t++) {
      if (!usedTeams.has(t)) {
        assignedTeam = t;
        break;
      }
    }

    const relayPlayer = {
      id: guestId,
      name: (guestMsg.name || `해적 ${guestId.slice(-3)}`).trim(),
      shipClass: guestMsg.shipClass || 'cutter',
      teamId: assignedTeam,
      isHost: false,
      isReady: true,
      isRelay: true
    };

    const existingIdx = this.lobbyPlayers.findIndex((p) => p.id === guestId);
    if (existingIdx >= 0) {
      this.lobbyPlayers[existingIdx] = relayPlayer;
    } else {
      this.lobbyPlayers.push(relayPlayer);
    }

    this.connections.set(guestId, {
      pc: null,
      dc: null,
      guestId,
      player: relayPlayer,
      isRelay: true,
      info: guestMsg
    });

    // 1. Send Direct JOIN_ACK to Relay Guest
    this.signaling.sendRelayHostMessage(roomCode, guestId, {
      type: 'JOIN_ACK',
      accepted: true,
      players: this.lobbyPlayers,
      teamId: assignedTeam
    });

    // 2. Listen to this Relay Guest's Incoming Messages
    this.signaling.listenRelayGuestMessages(roomCode, guestId, (data) => {
      this._handleHostReceiveData(guestId, data);
    });

    this.emitStatus(`⚡ [${relayPlayer.name}] 선원 릴레이 모드로 탑승 완료! (${this.lobbyPlayers.length}/4명)`);
    this._notifyLobby();
    this.broadcastLobbyState();
  }

  _setupHostDataChannel(dc, guestId) {
    dc.onopen = () => {
      this.emitStatus(`선원 [${guestId}] P2P 직접 연결 성공!`);
      // Cleanup signaling node for this guest to keep DB 0 bytes
      this.signaling.cleanupGuestSignaling(this.roomCode, guestId);
      this.broadcastLobbyState();
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._handleHostReceiveData(guestId, msg);
      } catch (err) {}
    };

    dc.onclose = () => {
      this._removeGuest(guestId);
    };
  }

  _handleHostReceiveData(guestId, msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'client_input') {
      if (this.onClientInput) this.onClientInput(guestId, msg.inputs);
    } else if (msg.type === 'client_ready') {
      const p = this.lobbyPlayers.find((lp) => lp.id === guestId);
      if (p) p.isReady = !!msg.ready;
      this._notifyLobby();
      this.broadcastLobbyState();
    } else if (msg.type === 'client_event') {
      if (this.onEventPacket) this.onEventPacket(guestId, msg.event);
    }
  }

  _removeGuest(peerId) {
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
      this.emitStatus(`👋 ${leaving.name} 선원이 퇴장했습니다.`);
    }
    this._notifyLobby();
    this.broadcastLobbyState();
  }

  // --- Guest: Join Room (Tier 1 WebRTC P2P -> Tier 2 Firebase Relay Fallback) ---
  joinGuestRoom(numericCode, guestName, shipClass = 'cutter') {
    return new Promise(async (resolve, reject) => {
      this.destroy();
      this.isHost = false;
      this.myName = (guestName || '선원').trim();
      this.myShipClass = shipClass;
      const cleanCode = PirateCoinNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;

      const guestId = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      this.myPeerId = guestId;
      this.connectionMode = 'p2p';

      this.emitStatus(`방 [${cleanCode}] 찾는 중...`);

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
          this.destroy();
          const errorMsg = `방 번호 [${cleanCode}]에 연결할 수 없습니다. 방장이 대기 중인지 확인해 주세요.`;
          this.emitStatus(`❌ ${errorMsg}`);
          if (this.onError) this.onError(new Error(errorMsg));
          settle('reject', new Error(errorMsg));
        }
      }, CONNECTION_TOTAL_TIMEOUT_MS);

      // --- Trigger Automatic Firebase Relay Fallback ---
      const fallbackToRelayMode = async (reason = '') => {
        if (settled || this.connectionMode === 'relay') return;
        this.connectionMode = 'relay';
        if (p2pFallbackTimer) clearTimeout(p2pFallbackTimer);

        console.info(`[Pirate Relay Fallback] Direct P2P unreachable (${reason}). Seamlessly switching to Firebase RTDB Relay...`);
        this.emitStatus('🔄 다양한 접속 환경 감지 ➔ Firebase 안전 릴레이 모드로 자동 연결 완료!');

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
                this.myTeamId = data.teamId !== undefined ? data.teamId : this.myTeamId;
                this.emitStatus('🎉 안전 릴레이 모드로 대기실 탑승 완료!');
                this._notifyLobby();
                settle('resolve', cleanCode);
              }
            } else {
              this._handleGuestReceivedData(data);
            }
          });

          // 3. Post JOIN_LOBBY into Firebase Relay Node
          const sendJoin = () => {
            if (settled && this.connectionMode !== 'relay') return;
            this.signaling.sendRelayGuestMessage(cleanCode, guestId, {
              type: 'JOIN_LOBBY',
              name: this.myName,
              shipClass: this.myShipClass
            });
          };

          sendJoin();
          let joinRetryCount = 0;
          const joinRetryTimer = setInterval(() => {
            if (settled || this.connectionMode !== 'relay' || joinRetryCount >= 10) {
              clearInterval(joinRetryTimer);
              return;
            }
            joinRetryCount++;
            sendJoin();
          }, 400);
        } catch (err) {
          console.error('[Pirate Relay Fallback Error]', err);
          settle('reject', err);
        }
      };

      try {
        const room = await this.signaling.checkRoom(cleanCode);
        this.emitStatus(`방장 [${room.host.name}] 확인! WebRTC 핸드셰이크 요청 중...`);

        // Set 4-Second Timeout for Tier 1 Direct P2P
        p2pFallbackTimer = setTimeout(() => {
          if (this.connectionMode === 'p2p') {
            fallbackToRelayMode('P2P 직결 시간 초과 (4초)');
          }
        }, P2P_HANDSHAKE_TIMEOUT_MS);

        const pc = new RTCPeerConnection(RTC_CONFIG);
        const dc = pc.createDataChannel('pirateDataChannel', { ordered: false });
        this.hostConnection = { pc, dc };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.signaling.sendGuestCandidate(cleanCode, guestId, event.candidate);
          }
        };

        dc.onopen = () => {
          if (this.connectionMode === 'p2p') {
            if (p2pFallbackTimer) clearTimeout(p2pFallbackTimer);
            this.emitStatus('방장과 P2P 직접 연결 성공! 대기실 입장');
            if (this.roomCode && this.myPeerId) {
              this.signaling.cleanupGuestSignaling(this.roomCode, this.myPeerId);
            }
            settle('resolve', cleanCode);
          }
        };

        dc.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            this._handleGuestReceivedData(msg);
          } catch (err) {}
        };

        dc.onclose = () => {
          if (this.connectionMode === 'p2p') {
            this.emitStatus('방장과의 연결이 끊어졌습니다.');
            if (this.onDisconnect) this.onDisconnect();
          }
        };

        dc.onerror = (err) => {
          if (this.connectionMode === 'p2p') {
            console.warn('[Pirate P2P DC Error, triggering relay fallback]:', err);
            fallbackToRelayMode('DataChannel 에러');
          }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        await this.signaling.joinRoomWithOffer(
          cleanCode,
          guestId,
          {
            name: this.myName,
            shipClass: this.myShipClass
          },
          offer
        );

        this.signaling.listenForAnswer(cleanCode, guestId, async (answer) => {
          try {
            if (pc.signalingState !== 'closed') {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              this.emitStatus('방장 응답 수신! P2P 연결 수립 중...');
            }
          } catch (e) {}
        });

        this.signaling.listenForHostCandidates(cleanCode, guestId, (cand) => {
          try {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          } catch (e) {}
        });
      } catch (err) {
        this.emitStatus(`입장 실패: ${err.message}`);
        if (this.onError) this.onError(err);
        settle('reject', err);
      }
    });
  }

  _handleGuestReceivedData(msg) {
    if (!msg || !msg.type) return;

    if (msg.type === 'lobby_state') {
      this.lobbyPlayers = msg.players || [];
      const me = this.lobbyPlayers.find((p) => p.id === this.myPeerId);
      if (me) this.myTeamId = me.teamId;
      this._notifyLobby();
    } else if (msg.type === 'game_start') {
      if (this.onGameStart) this.onGameStart(msg.config);
    } else if (msg.type === 'game_snapshot') {
      if (this.onSnapshot) this.onSnapshot(msg.snapshot);
    } else if (msg.type === 'game_over') {
      if (this.onGameOver) this.onGameOver(msg.results);
    }
  }

  // --- Broadcast & Communication Methods (Dual P2P + Relay) ---
  broadcastLobbyState() {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'lobby_state',
      players: this.lobbyPlayers
    });

    // 1. Direct P2P
    this.connections.forEach(({ dc, isRelay }) => {
      if (!isRelay && dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });

    // 2. Firebase Relay Broadcast
    const hasRelayGuests = Array.from(this.connections.values()).some((c) => c.isRelay);
    if (hasRelayGuests && this.roomCode) {
      this.signaling.broadcastRelay(this.roomCode, {
        type: 'lobby_state',
        players: this.lobbyPlayers
      });
    }
  }

  broadcastGameStart(config) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'playing');
    const packet = JSON.stringify({
      type: 'game_start',
      config
    });

    // 1. Direct P2P
    this.connections.forEach(({ dc, isRelay }) => {
      if (!isRelay && dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });

    // 2. Firebase Relay Broadcast
    const hasRelayGuests = Array.from(this.connections.values()).some((c) => c.isRelay);
    if (hasRelayGuests && this.roomCode) {
      this.signaling.broadcastRelay(this.roomCode, {
        type: 'game_start',
        config
      });
    }
  }

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'game_snapshot',
      snapshot
    });

    // 1. Direct P2P (Full rate, e.g. 30Hz)
    this.connections.forEach(({ dc, isRelay }) => {
      if (!isRelay && dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });

    // 2. Firebase Relay Broadcast (Throttled to 10Hz/100ms to preserve quota)
    const hasRelayGuests = Array.from(this.connections.values()).some((c) => c.isRelay);
    if (hasRelayGuests && this.roomCode) {
      const now = Date.now();
      if (now - this.lastRelayBroadcastTime >= 100) {
        this.lastRelayBroadcastTime = now;
        this.signaling.broadcastRelay(this.roomCode, {
          type: 'game_snapshot',
          snapshot
        });
      }
    }
  }

  broadcastGameOver(results) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'game_over',
      results
    });

    // 1. Direct P2P
    this.connections.forEach(({ dc, isRelay }) => {
      if (!isRelay && dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });

    // 2. Firebase Relay Broadcast
    const hasRelayGuests = Array.from(this.connections.values()).some((c) => c.isRelay);
    if (hasRelayGuests && this.roomCode) {
      this.signaling.broadcastRelay(this.roomCode, {
        type: 'game_over',
        results
      });
    }
  }

  sendClientInputs(inputs) {
    if (this.isHost) return;

    if (this.connectionMode === 'p2p') {
      // Direct P2P DataChannel
      if (this.hostConnection && this.hostConnection.dc && this.hostConnection.dc.readyState === 'open') {
        try {
          this.hostConnection.dc.send(JSON.stringify({
            type: 'client_input',
            inputs
          }));
        } catch (e) {}
      }
    } else if (this.connectionMode === 'relay') {
      // Firebase Relay Mode (Throttled to 10Hz/100ms)
      const now = Date.now();
      if (now - this.lastRelayInputTime >= 100) {
        this.lastRelayInputTime = now;
        this.signaling.sendRelayGuestMessage(this.roomCode, this.myPeerId, {
          type: 'client_input',
          inputs
        });
      }
    }
  }

  _notifyLobby() {
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- Cleanup & Tear Down ---
  destroy() {
    if (this.isHost && this.roomCode) {
      this.signaling.cleanupRoom(this.roomCode);
    } else if (this.roomCode && this.myPeerId) {
      if (this.connectionMode === 'relay') {
        this.signaling.cleanupRelay(this.roomCode, this.myPeerId);
      }
      this.signaling.cleanupGuestSignaling(this.roomCode, this.myPeerId);
    }

    this.signaling.cleanup();

    this.connections.forEach(({ pc, dc, guestId, isRelay }) => {
      try { if (dc) dc.close(); } catch (e) {}
      try { if (pc) pc.close(); } catch (e) {}
      if (isRelay && this.roomCode && guestId) {
        this.signaling.cleanupRelay(this.roomCode, guestId);
      }
    });
    this.connections.clear();

    if (this.hostConnection) {
      try { if (this.hostConnection.dc) this.hostConnection.dc.close(); } catch (e) {}
      try { if (this.hostConnection.pc) this.hostConnection.pc.close(); } catch (e) {}
      this.hostConnection = null;
    }

    this.roomCode = '';
    this.isHost = false;
    this.connectionMode = 'p2p';
    this.lobbyPlayers = [];
  }
}

export const pirateNet = new PirateCoinNetworkManager();
