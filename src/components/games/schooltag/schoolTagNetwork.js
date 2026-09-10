// Dochon Games Portal - School Tag WebRTC P2P Network Manager
// Hybrid P2P: Firebase RTDB Signaling (Handshake only) + W3C Native WebRTC DataChannel (P2P In-game)
// 100% Zero external cloud dependencies (No PeerJS / 0.peerjs.com)
// Leaves 0 bytes in Firebase after connection is established

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

const CONNECTION_TIMEOUT_MS = 18000;
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

    // Host State: Map of guestId -> { pc, dc, player }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, skinId, role, isHost, isReady, slotIndex }]

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

  // --- HOST: Create a P2P Room via Firebase RTDB Signaling ---
  async createRoom(numericCode, playerName, role = ROLE_TYPES.RUNNER, skinId = 'boy') {
    this.disconnect();

    const cleanCode = SchoolTagNetworkManager.cleanCode(numericCode);
    this.roomCode = cleanCode;
    this.isHost = true;
    this.myPeerId = 'host';
    this.myName = (playerName || '방장(학생)').trim();
    this.myRole = role;
    this.mySkinId = skinId;

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

        // Listen for incoming guest join offers in Firebase RTDB
        this.signaling.listenForGuests(codeToTry, (guestId, guestData) => {
          this.handleIncomingGuest(guestId, guestData);
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

  // --- HOST: Handle Incoming Guest WebRTC Offer ---
  async handleIncomingGuest(guestId, guestData) {
    if (this.connections.has(guestId)) return;
    if (this.lobbyPlayers.length >= 4) return; // Max 4 players

    this._emitStatus(`👋 ${guestData.name || '친구'}님이 입장을 시도합니다...`);

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

  // --- HOST: Setup DataChannel for Connected Guest ---
  setupHostDataChannel(guestId, pc, dc, guestData) {
    dc.onopen = () => {
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
      this.connections.set(guestId, { pc, dc, player: newPlayer });

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

      this._emitStatus(`🎉 ${newPlayer.name}님이 입장했습니다! (${this.lobbyPlayers.length}/4)`);
      this._broadcastLobby();
    };

    dc.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data || !data.type) return;

        switch (data.type) {
          case 'CLIENT_INPUT':
            if (this.onPlayerInput) {
              this.onPlayerInput(guestId, data.payload);
            }
            break;

          case 'CLIENT_ACTION':
            if (this.onPlayerAction) {
              this.onPlayerAction(guestId, data.payload);
            }
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[Host Data Parsing Error]', err);
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

  _handlePlayerLeave(peerId) {
    if (!this.isHost) return;

    if (this.connections.has(peerId)) {
      const conn = this.connections.get(peerId);
      try { conn.dc.close(); } catch (e) {}
      try { conn.pc.close(); } catch (e) {}
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
    this._broadcastToAll({
      type: 'LOBBY_STATE',
      players: this.lobbyPlayers,
      roomCode: this.roomCode
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  _broadcastToAll(data) {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(payload);
        } catch (e) {}
      }
    });
  }

  // --- GUEST: Join Room via Firebase RTDB Signaling ---
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
        const dc = pc.createDataChannel('schoolTagChannel', { ordered: true });
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
                this._emitStatus('🎉 대기실 입장 완료!');
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
          this._emitStatus('❌ 방장과의 연결이 종료되었습니다.');
          if (this.onDisconnect) this.onDisconnect('방장과의 연결이 끊어졌습니다.');
        };

        dc.onerror = (err) => {
          console.warn('[Guest DataChannel Error]', err);
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

  // --- Match Control (Host -> Guests via P2P DataChannel) ---
  broadcastGameStart(matchData) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'playing');
    this._broadcastToAll({ type: 'GAME_START', matchData });
    if (this.onGameStart) this.onGameStart(matchData);
  }

  broadcastGameState(state) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'GAME_STATE', state });
  }

  broadcastTagEvent(tagData) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'TAG_EVENT', ...tagData });
    if (this.onTagEvent) this.onTagEvent(tagData);
  }

  broadcastKeyEvent(keyData) {
    if (!this.isHost) return;
    this._broadcastToAll({ type: 'KEY_COLLECTED', ...keyData });
    if (this.onKeyEvent) this.onKeyEvent(keyData);
  }

  broadcastGameOver(result) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'finished');
    this._broadcastToAll({ type: 'GAME_OVER', result });
    if (this.onGameOver) this.onGameOver(result);
  }

  // --- Client Controls (Guest -> Host via P2P DataChannel) ---
  sendClientInput(input) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.dc) return;
    if (this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(
          JSON.stringify({
            type: 'CLIENT_INPUT',
            payload: input
          })
        );
      } catch (e) {}
    }
  }

  sendClientAction(action) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.dc) return;
    if (this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(
          JSON.stringify({
            type: 'CLIENT_ACTION',
            payload: action
          })
        );
      } catch (e) {}
    }
  }

  // --- Disconnect & Complete Cleanup ---
  disconnect() {
    if (this.isHost && this.roomCode) {
      this.signaling.cleanupRoom(this.roomCode);
    }

    if (this.connections) {
      this.connections.forEach(({ pc, dc }) => {
        try { if (dc) dc.close(); } catch (_) {}
        try { if (pc) pc.close(); } catch (_) {}
      });
      this.connections.clear();
    }

    if (this.hostConnection) {
      try { if (this.hostConnection.dc) this.hostConnection.dc.close(); } catch (_) {}
      try { if (this.hostConnection.pc) this.hostConnection.pc.close(); } catch (_) {}
      this.hostConnection = null;
    }

    this.signaling.cleanup();

    this.lobbyPlayers = [];
    this.isHost = false;
    this.roomCode = '';
  }
}
