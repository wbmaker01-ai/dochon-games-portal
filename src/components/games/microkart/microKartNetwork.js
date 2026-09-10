// Dochon Games Portal - Micro Kart Racing WebRTC P2P Network Manager
// Dedicated Firebase RTDB WebRTC Signaling (Zero external PeerJS dependencies)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to Firebase RTDB Room Broker
// Native W3C RTCPeerConnection + RTCDataChannel with High-Reliability STUN/TURN Pool

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

const CONNECTION_TIMEOUT_MS = 18000;
const RTC_CONFIG = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 2
};

export class MicroKartNetworkManager {
  constructor() {
    this.signaling = new FirebaseSignaling('microkart');

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'eraser';

    // Host State: Map of guestId -> { pc, dc, player }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, skinId, isHost, isReady, slotIndex }]
    this.selectedTrackId = 1;

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onTrackChange = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onClientInput = null;
    this.onItemEvent = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null; // Status message callback for UI feedback
    this.onRoomCodeChanged = null;  // Notifies UI if host code had to be auto-regenerated
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
  async createRoom(numericCode, playerName, skinId = 'eraser') {
    this.disconnect();

    const cleanCode = MicroKartNetworkManager.cleanCode(numericCode);
    this.roomCode = cleanCode;
    this.isHost = true;
    this.myPeerId = 'host';
    this.myName = (playerName || '방장').trim();
    this.mySkinId = skinId;

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
        if (err.message && err.message.includes('이미 다른 방장이 사용 중') && autoRetryCount < 2) {
          autoRetryCount++;
          const newCode = MicroKartNetworkManager.generateRandomCode();
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
    if (this.lobbyPlayers.length >= 4) return; // Max 4 players in Micro Kart

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
      console.error('[MicroKart Host Handshake Error]', err);
      pc.close();
    }
  }

  // --- HOST: Setup DataChannel for Connected Guest ---
  setupHostDataChannel(guestId, pc, dc, guestData) {
    dc.onopen = () => {
      const newPlayer = {
        id: guestId,
        name: (guestData.name || `참가자-${this.lobbyPlayers.length + 1}`).trim(),
        skinId: guestData.skinId || 'pencil',
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
            trackId: this.selectedTrackId,
            slotIndex: newPlayer.slotIndex
          })
        );
      } catch (e) {}

      // Clean up guest signaling node in Firebase RTDB (Zero bytes left!)
      this.signaling.cleanupGuestSignaling(this.roomCode, guestId);

      this._emitStatus(`⚡ ${newPlayer.name}님과 P2P 연결 완료! (${this.lobbyPlayers.length}/4명)`);
      this.broadcastLobbyUpdate();
    };

    dc.onmessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        this.handleHostReceiveData(guestId, data);
      } catch (err) {
        console.error('[MicroKart Host Data Parsing Error]', err);
      }
    };

    dc.onclose = () => {
      this.connections.delete(guestId);
      this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== guestId);
      this._emitStatus(`👋 친구 한 명이 퇴장했습니다. (${this.lobbyPlayers.length}/4명)`);
      this.broadcastLobbyUpdate();
    };

    dc.onerror = (err) => {
      console.warn(`[MicroKart Host Guest DC Error: ${guestId}]`, err);
    };
  }

  // --- HOST: Handle Incoming In-game Data from Guest ---
  handleHostReceiveData(guestId, data) {
    if (!data || !data.type) return;

    if (data.type === 'CLIENT_INPUT') {
      if (this.onClientInput) {
        this.onClientInput(guestId, data.input);
      }
    }
  }

  // --- HOST: Broadcast Lobby State to All Guests ---
  broadcastLobbyUpdate() {
    this.broadcastToGuests({
      type: 'LOBBY_UPDATE',
      players: this.lobbyPlayers,
      trackId: this.selectedTrackId
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- GUEST: Join Room via Firebase RTDB Signaling ---
  joinRoom(numericCode, playerName, skinId = 'pencil') {
    return new Promise(async (resolve, reject) => {
      this.disconnect();

      const cleanCode = MicroKartNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = (playerName || '게스트').trim();
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
        const dc = pc.createDataChannel('microKartDataChannel', { ordered: true });
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
                if (data.trackId) {
                  this.selectedTrackId = data.trackId;
                  if (this.onTrackChange) this.onTrackChange(data.trackId);
                }
                this._emitStatus('🎉 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);

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
            console.error('[MicroKart Guest Data Parsing Error]', err);
          }
        };

        dc.onclose = () => {
          this._emitStatus('❌ 방장과의 연결이 종료되었습니다.');
          if (this.onDisconnect) this.onDisconnect('방장과의 연결이 끊어졌습니다.');
        };

        dc.onerror = (err) => {
          console.warn('[MicroKart Guest DataChannel Error]', err);
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

        this._emitStatus('⏳ 방장의 수락을 기다리는 중...');

        // 4. Listen for SDP Answer from Host
        this.signaling.listenForAnswer(cleanCode, guestId, async (answer) => {
          try {
            if (!pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
              isRemoteDescSet = true;

              // Drain queued candidates
              for (const cand of candidateQueue) {
                try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
              }
            }
          } catch (err) {
            console.error('[MicroKart Guest Set Remote Answer Error]', err);
          }
        });

        // 5. Listen for Host's ICE candidates
        this.signaling.listenForHostCandidates(cleanCode, guestId, (cand) => {
          if (!isRemoteDescSet) {
            candidateQueue.push(cand);
          } else {
            pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
          }
        });
      } catch (err) {
        const errorMsg = err.message || '방 참여 중 오류가 발생했습니다.';
        this._emitStatus(`❌ ${errorMsg}`);
        if (this.onError) this.onError(errorMsg);
        settle('reject', err);
      }
    });
  }

  // --- GUEST: Handle Incoming In-game Data from Host ---
  handleGuestReceiveData(data) {
    if (!data || !data.type) return;

    if (data.type === 'LOBBY_UPDATE') {
      this.lobbyPlayers = data.players || [];
      if (data.trackId) {
        this.selectedTrackId = data.trackId;
        if (this.onTrackChange) this.onTrackChange(data.trackId);
      }
      if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
    } else if (data.type === 'TRACK_CHANGE') {
      this.selectedTrackId = data.trackId;
      if (this.onTrackChange) this.onTrackChange(data.trackId);
    } else if (data.type === 'GAME_START') {
      const trackId = data.trackId || (data.config && data.config.trackId) || this.selectedTrackId || 1;
      this.selectedTrackId = trackId;
      if (this.onGameStart) this.onGameStart({ trackId, ...(data.config || {}) });
    } else if (data.type === 'SNAPSHOT') {
      if (this.onSnapshot) this.onSnapshot(data.snapshot || data);
    } else if (data.type === 'GAME_OVER') {
      if (this.onGameOver) this.onGameOver(data.results);
    }
  }

  // --- Track Change Broadcast (Host -> Guests) ---
  broadcastTrackChange(trackId) {
    this.selectedTrackId = trackId;
    if (!this.isHost) return;
    this.broadcastToGuests({ type: 'TRACK_CHANGE', trackId });
  }

  // --- Game Start Broadcast (Host -> Guests) ---
  broadcastGameStart(config = {}) {
    if (!this.isHost) return;
    const fullConfig = { trackId: this.selectedTrackId || 1, ...config };
    this.broadcastToGuests({ type: 'GAME_START', config: fullConfig, trackId: this.selectedTrackId || 1 });
  }

  // --- Snapshot Broadcast (Host -> Guests) ---
  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    this.broadcastToGuests({ type: 'SNAPSHOT', snapshot });
  }

  // --- Client Input Send (Guest -> Host) ---
  sendClientInput(input) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.dc) return;
    if (this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(JSON.stringify({ type: 'CLIENT_INPUT', input }));
      } catch (e) {}
    }
  }

  // --- Game Over Broadcast (Host -> Guests) ---
  broadcastGameOver(results) {
    if (!this.isHost) return;
    this.broadcastToGuests({ type: 'GAME_OVER', results });
  }

  // --- Send Payload to All Connected Guests ---
  broadcastToGuests(msg) {
    const payload = typeof msg === 'string' ? msg : JSON.stringify(msg);
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try {
          dc.send(payload);
        } catch (e) {}
      }
    });
  }

  // --- Disconnect & Complete Resource Cleanup ---
  disconnect() {
    if (this.isHost && this.roomCode) {
      this.signaling.cleanupRoom(this.roomCode).catch(() => {});
    } else {
      this.signaling.cleanup();
    }

    if (this.hostConnection) {
      try {
        if (this.hostConnection.dc) this.hostConnection.dc.close();
        if (this.hostConnection.pc) this.hostConnection.pc.close();
      } catch (e) {}
      this.hostConnection = null;
    }

    this.connections.forEach(({ pc, dc }) => {
      try {
        if (dc) dc.close();
        if (pc) pc.close();
      } catch (e) {}
    });
    this.connections.clear();

    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.lobbyPlayers = [];
    this.selectedTrackId = 1;
  }
}

export const microKartNet = new MicroKartNetworkManager();
