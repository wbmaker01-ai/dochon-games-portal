// Dochon Games Portal - Dochon Pirate Coin Heist WebRTC P2P Network Manager
// Dedicated Firebase RTDB WebRTC Signaling (Zero external PeerJS dependencies)
// 4-Digit Numeric Room Code to Firebase RTDB Room Broker
// Native W3C RTCPeerConnection + RTCDataChannel with High-Reliability STUN/TURN Pool

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

    // Host State: Map of guestId -> { pc, dc, player }
    this.connections = new Map();

    // Guest State: { pc, dc }
    this.hostConnection = null;

    this.lobbyPlayers = []; // [{ id, name, shipClass, teamId, isHost, isReady }]

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
          isReady: true
        }
      ];

      this._notifyLobby();
      this.emitStatus(`방 [${cleanCode}] 생성 완료! 선원 대기 중...`);

      // Listen for incoming guests
      this.signaling.listenForGuests(cleanCode, async (guestId, guestData) => {
        if (this.connections.size >= 3) return; // Max 4 players
        await this._handleIncomingGuest(cleanCode, guestId, guestData);
      });

      return cleanCode;
    } catch (err) {
      this.emitStatus(`방 생성 실패: ${err.message}`);
      if (this.onError) this.onError(err);
      throw err;
    }
  }

  // --- Host: Handle Incoming Guest Offer ---
  async _handleIncomingGuest(roomCode, guestId, guestData) {
    if (this.connections.has(guestId)) return;

    this.emitStatus(`${guestData.name || '새 선원'} 핸드셰이크 연결 중...`);

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const connObj = { pc, dc: null, guestId, info: guestData };
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
      this.lobbyPlayers.push({
        id: guestId,
        name: guestData.name || `해적 ${guestId.slice(-3)}`,
        shipClass: guestData.shipClass || 'cutter',
        teamId: assignedTeam,
        isHost: false,
        isReady: true
      });
      this._notifyLobby();
      this.broadcastLobbyState();
    } catch (err) {
      this.connections.delete(guestId);
      console.error('[Pirate Host Handshake Error]', err);
    }
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
      } catch (err) {}
    };

    dc.onclose = () => {
      this.connections.delete(guestId);
      this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== guestId);
      this._notifyLobby();
      this.broadcastLobbyState();
    };
  }

  // --- Guest: Join Room via Firebase RTDB ---
  async joinGuestRoom(numericCode, guestName, shipClass = 'cutter') {
    this.destroy();
    this.isHost = false;
    this.myName = (guestName || '선원').trim();
    this.myShipClass = shipClass;
    const cleanCode = PirateCoinNetworkManager.cleanCode(numericCode);
    this.roomCode = cleanCode;

    const guestId = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    this.myPeerId = guestId;

    this.emitStatus(`방 [${cleanCode}] 찾는 중...`);

    try {
      const room = await this.signaling.checkRoom(cleanCode);
      this.emitStatus(`방장 [${room.host.name}] 확인! WebRTC 핸드셰이크 요청 중...`);

      const pc = new RTCPeerConnection(RTC_CONFIG);
      const dc = pc.createDataChannel('pirateDataChannel', { ordered: false });
      this.hostConnection = { pc, dc };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          this.signaling.sendGuestCandidate(cleanCode, guestId, event.candidate);
        }
      };

      this._setupGuestDataChannel(dc);

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

      return cleanCode;
    } catch (err) {
      this.emitStatus(`입장 실패: ${err.message}`);
      if (this.onError) this.onError(err);
      throw err;
    }
  }

  _setupGuestDataChannel(dc) {
    dc.onopen = () => {
      this.emitStatus('방장과 P2P 직접 연결 성공! 대기실 입장');
      if (this.roomCode && this.myPeerId) {
        this.signaling.cleanupGuestSignaling(this.roomCode, this.myPeerId);
      }
    };

    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
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
      } catch (err) {}
    };

    dc.onclose = () => {
      this.emitStatus('방장과의 연결이 끊어졌습니다.');
      if (this.onDisconnect) this.onDisconnect();
    };
  }

  // --- Broadcast & Communication Methods ---
  broadcastLobbyState() {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'lobby_state',
      players: this.lobbyPlayers
    });
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });
  }

  broadcastGameStart(config) {
    if (!this.isHost) return;
    this.signaling.updateRoomStatus(this.roomCode, 'playing');
    const packet = JSON.stringify({
      type: 'game_start',
      config
    });
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });
  }

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'game_snapshot',
      snapshot
    });
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });
  }

  broadcastGameOver(results) {
    if (!this.isHost) return;
    const packet = JSON.stringify({
      type: 'game_over',
      results
    });
    this.connections.forEach(({ dc }) => {
      if (dc && dc.readyState === 'open') {
        try { dc.send(packet); } catch (e) {}
      }
    });
  }

  sendClientInputs(inputs) {
    if (this.isHost) return;
    if (this.hostConnection && this.hostConnection.dc && this.hostConnection.dc.readyState === 'open') {
      try {
        this.hostConnection.dc.send(JSON.stringify({
          type: 'client_input',
          inputs
        }));
      } catch (e) {}
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
      this.signaling.cleanupGuestSignaling(this.roomCode, this.myPeerId);
    }

    this.signaling.cleanup();

    this.connections.forEach(({ pc, dc }) => {
      try { if (dc) dc.close(); } catch (e) {}
      try { if (pc) pc.close(); } catch (e) {}
    });
    this.connections.clear();

    if (this.hostConnection) {
      try { if (this.hostConnection.dc) this.hostConnection.dc.close(); } catch (e) {}
      try { if (this.hostConnection.pc) this.hostConnection.pc.close(); } catch (e) {}
      this.hostConnection = null;
    }

    this.roomCode = '';
    this.isHost = false;
    this.lobbyPlayers = [];
  }
}

export const pirateNet = new PirateCoinNetworkManager();
