// Dochon Games Portal - Micro Kart Racing WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-mkart-XXXX' Peer ID
// v3: Multi-Tier Metered TURN Relays (Ports 80/443), WebSocket Heartbeat & Handshake Retries for School Networks

import { Peer } from 'peerjs';

export const MICROKART_PEER_PREFIX = 'dochon-mkart-';

// Multi-tier ICE Servers: High-availability STUN + Port 80/443 TURN Relays
// Bypasses restrictive school firewalls, symmetric NATs, and carrier-grade NATs
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
const MAX_CONNECT_RETRIES = 3;

export class MicroKartNetworkManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'eraser';
    this.connections = new Map();
    this.hostConnection = null;
    this.heartbeatTimer = null;

    this.lobbyPlayers = [];
    this.selectedTrackId = 1;

    // Callbacks
    this.onLobbyUpdate = null;
    this.onTrackChange = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onClientInput = null;
    this.onItemEvent = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null;
    this.onRoomCodeChanged = null;
  }

  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  _emitStatus(message) {
    if (this.onConnectionStatus) this.onConnectionStatus(message);
  }

  static cleanCode(code) {
    const digits = String(code || '').replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 4);
  }

  // 10-Second WebSocket Keep-Alive Heartbeat for School Network Firewalls
  _startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected) {
          console.warn('[MicroKart P2P] Peer disconnected from signaling server, reconnecting...');
          try {
            this.peer.reconnect();
          } catch (err) {
            console.error('[MicroKart P2P] Reconnect failed:', err);
          }
        }
      }
    }, 10000);
  }

  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // --- HOST: Create a P2P Room with Auto-Retry & Duplicate Avoidance ---
  createRoom(roomCode, playerName, skinId) {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = true;
      const cleanCode = MicroKartNetworkManager.cleanCode(roomCode);
      this.roomCode = cleanCode;
      this.myName = (playerName || '호스트').trim();
      this.mySkinId = skinId || 'eraser';
      let autoRetryCount = 0;

      const timeoutId = setTimeout(() => {
        this._emitStatus('⏰ 시그널링 서버 연결 시간 초과');
        const err = new Error('시그널링 서버 연결 시간 초과 (18초). 인터넷 네트워크 연결 상태를 확인해주세요.');
        if (this.onError) this.onError(err.message);
        this.disconnect();
        reject(err);
      }, CONNECTION_TIMEOUT_MS);

      const attemptHostInit = (codeToTry) => {
        const fullPeerId = `${MICROKART_PEER_PREFIX}${codeToTry}`;
        this.roomCode = codeToTry;
        this.myPeerId = fullPeerId;
        this._emitStatus(`🔗 P2P 시그널링 서버에 방(${codeToTry}) 등록 중...`);

        try {
          this.peer = new Peer(fullPeerId, {
            config: {
              iceServers: ICE_SERVERS,
              iceCandidatePoolSize: 10
            },
            debug: 0
          });

          this.peer.on('open', (id) => {
            clearTimeout(timeoutId);
            this.myPeerId = id;
            this._startHeartbeat();
            this.lobbyPlayers = [
              {
                id: this.myPeerId,
                name: this.myName,
                skinId: this.mySkinId,
                isHost: true,
                isReady: true,
                slotIndex: 0
              }
            ];

            this._emitStatus(`✅ 방(${codeToTry}) 개설 완료! 참가자를 기다리는 중...`);
            if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
            resolve(this.roomCode);
          });

          this.peer.on('connection', (conn) => {
            this._emitStatus(`👋 새로운 친구가 접속을 시도합니다...`);
            this._setupHostIncomingConnection(conn);
          });

          this.peer.on('disconnected', () => {
            console.warn('[MicroKart P2P Host] Disconnected from signaling server. Reconnecting...');
            if (this.peer && !this.peer.destroyed) {
              try {
                this.peer.reconnect();
              } catch (e) {
                console.error('[MicroKart P2P Host] Reconnect failed:', e);
              }
            }
          });

          this.peer.on('error', (err) => {
            console.warn('[MicroKart P2P Host Error]', err.type, err);
            if (err.type === 'unavailable-id') {
              if (autoRetryCount < 2) {
                autoRetryCount++;
                const newCode = MicroKartNetworkManager.generateRandomCode();
                this._emitStatus(`🔄 방 번호 중복 감지: 새 번호(${newCode})로 자동 개설 중...`);
                if (this.onRoomCodeChanged) this.onRoomCodeChanged(newCode);
                this.disconnect();
                setTimeout(() => attemptHostInit(newCode), 500);
                return;
              }
              clearTimeout(timeoutId);
              const msg = `방 번호(${codeToTry})가 이미 사용 중입니다. 다른 번호로 다시 시도해주세요.`;
              this._emitStatus(`❌ ${msg}`);
              reject(new Error(msg));
            } else {
              clearTimeout(timeoutId);
              const msg = `P2P 네트워크 오류: ${err.message || err.type}`;
              this._emitStatus(`❌ ${msg}`);
              reject(new Error(msg));
            }
          });
        } catch (err) {
          clearTimeout(timeoutId);
          reject(err);
        }
      };

      attemptHostInit(cleanCode);
    });
  }

  _setupHostIncomingConnection(conn) {
    if (this.connections.size >= 3) {
      // Max 4 players in a race
      conn.on('open', () => {
        conn.send({ type: 'ROOM_FULL', message: '방 정원(4명)이 가득 찼습니다.' });
        setTimeout(() => conn.close(), 500);
      });
      return;
    }

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
    });

    conn.on('data', (data) => {
      this._handleHostReceivedData(conn, data);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== conn.peer);
      this._broadcastToGuests({ type: 'LOBBY_UPDATE', players: this.lobbyPlayers });
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
    });
  }

  _handleHostReceivedData(conn, data) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_LOBBY') {
      const existingIdx = this.lobbyPlayers.findIndex(p => p.id === conn.peer);
      const slotIndex = existingIdx >= 0 ? existingIdx : this.lobbyPlayers.length;
      const playerObj = {
        id: conn.peer,
        name: (data.name || '게스트').trim(),
        skinId: data.skinId || 'pencil',
        isHost: false,
        isReady: true,
        slotIndex
      };

      if (existingIdx >= 0) {
        this.lobbyPlayers[existingIdx] = playerObj;
      } else {
        this.lobbyPlayers.push(playerObj);
      }

      // Immediately respond with lobby state ACK
      conn.send({ type: 'LOBBY_UPDATE', players: this.lobbyPlayers, trackId: this.selectedTrackId });
      this._broadcastToGuests({ type: 'LOBBY_UPDATE', players: this.lobbyPlayers, trackId: this.selectedTrackId });
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
    } else if (data.type === 'CLIENT_INPUT') {
      if (this.onClientInput) {
        this.onClientInput(conn.peer, data.input);
      }
    }
  }

  // --- GUEST: Join a P2P Room with Multi-Tier Retries & Keep-Alive Handshake ---
  joinRoom(roomCode, playerName, skinId) {
    return new Promise((resolve, reject) => {
      this.disconnect();
      this.isHost = false;
      const cleanCode = MicroKartNetworkManager.cleanCode(roomCode);
      this.roomCode = cleanCode;
      this.myName = (playerName || '게스트').trim();
      this.mySkinId = skinId || 'pencil';

      const targetHostPeerId = `${MICROKART_PEER_PREFIX}${cleanCode}`;
      this._emitStatus(`🔍 방(${cleanCode}) 찾는 중... P2P 릴레이 경로 탐색`);

      let handshakeTimer = null;
      let isResolved = false;
      let retryAttempts = 0;
      let activeConn = null;

      const connectionTimeout = setTimeout(() => {
        if (handshakeTimer) clearInterval(handshakeTimer);
        if (!isResolved) {
          this._emitStatus(`⏰ 방(${cleanCode}) 연결 시간 초과`);
          this.disconnect();
          reject(new Error(`방(${cleanCode})을 찾을 수 없거나 방장이 아직 방을 개설하지 않았습니다. 번호를 확인해주세요.`));
        }
      }, CONNECTION_TIMEOUT_MS);

      const attemptConnect = (peerInstance) => {
        if (isResolved || !peerInstance || peerInstance.destroyed) return;

        try {
          if (activeConn) {
            try { activeConn.close(); } catch { /* ignore */ }
            activeConn = null;
          }

          this._emitStatus(`🤝 방장과 P2P 터널 연결 시도 중... (${retryAttempts + 1}/${MAX_CONNECT_RETRIES + 1})`);

          const conn = peerInstance.connect(targetHostPeerId, {
            reliable: true
          });
          activeConn = conn;
          this.hostConnection = conn;

          conn.on('open', () => {
            this._emitStatus(`⚡ P2P 채널 연결 성공! 대기실 입장 요청 전송 중...`);

            // Send JOIN_LOBBY payload
            const sendJoin = () => {
              if (conn.open) {
                conn.send({
                  type: 'JOIN_LOBBY',
                  name: this.myName,
                  skinId: this.mySkinId
                });
              }
            };
            sendJoin();

            // Handshake Keep-Alive Retry: repeat every 350ms until ACK / LOBBY_UPDATE received
            if (handshakeTimer) clearInterval(handshakeTimer);
            let ackRetries = 0;
            handshakeTimer = setInterval(() => {
              if (isResolved || !conn.open || ackRetries >= 12) {
                clearInterval(handshakeTimer);
                return;
              }
              ackRetries++;
              sendJoin();
            }, 350);
          });

          conn.on('data', (data) => {
            if (data.type === 'LOBBY_UPDATE' && !isResolved) {
              isResolved = true;
              clearTimeout(connectionTimeout);
              if (handshakeTimer) clearInterval(handshakeTimer);
              this._emitStatus(`✅ 대기실 입장 완료!`);
              resolve(cleanCode);
            }
            this._handleGuestReceivedData(data);
          });

          conn.on('close', () => {
            if (handshakeTimer) clearInterval(handshakeTimer);
            if (this.onDisconnect) this.onDisconnect('방장과의 연결이 종료되었습니다.');
          });

          conn.on('error', (err) => {
            console.warn('[MicroKart P2P Guest Conn Error]', err);
            if (!isResolved && retryAttempts < MAX_CONNECT_RETRIES) {
              retryAttempts++;
              setTimeout(() => attemptConnect(peerInstance), 1200);
            }
          });
        } catch (err) {
          console.error('[MicroKart P2P Connect Exception]', err);
        }
      };

      try {
        this.peer = new Peer({
          debug: 0,
          config: {
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 10
          }
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          this._startHeartbeat();
          attemptConnect(this.peer);
        });

        this.peer.on('disconnected', () => {
          if (this.peer && !this.peer.destroyed) {
            try { this.peer.reconnect(); } catch { /* ignore */ }
          }
        });

        this.peer.on('error', (err) => {
          console.warn('[MicroKart P2P Guest Peer Error]', err.type, err);
          if (!isResolved && retryAttempts < MAX_CONNECT_RETRIES) {
            retryAttempts++;
            const reason = err.type === 'peer-unavailable' ? '방장이 준비 중입니다' : '네트워크 경로 탐색 중';
            this._emitStatus(`⏳ ${reason}... 재시도 중 (${retryAttempts}/${MAX_CONNECT_RETRIES})`);
            setTimeout(() => {
              if (this.peer && !this.peer.destroyed && !isResolved) {
                attemptConnect(this.peer);
              }
            }, 1200 + retryAttempts * 300);
            return;
          }

          if (!isResolved && retryAttempts >= MAX_CONNECT_RETRIES) {
            clearTimeout(connectionTimeout);
            if (handshakeTimer) clearInterval(handshakeTimer);
            reject(new Error(`방(${cleanCode})에 접속할 수 없습니다. 방 번호를 확인하거나 방장이 열려있는지 확인해주세요.`));
          }
        });
      } catch (err) {
        clearTimeout(connectionTimeout);
        reject(err);
      }
    });
  }

  _handleGuestReceivedData(data) {
    if (!data || !data.type) return;

    if (data.type === 'LOBBY_UPDATE') {
      this.lobbyPlayers = data.players || [];
      if (data.trackId) {
        this.selectedTrackId = data.trackId;
        if (this.onTrackChange) this.onTrackChange(data.trackId);
      }
      if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
    } else if (data.type === 'TRACK_CHANGE') {
      this.selectedTrackId = data.trackId;
      if (this.onTrackChange) this.onTrackChange(data.trackId);
    } else if (data.type === 'GAME_START') {
      const trackId = data.trackId || (data.config && data.config.trackId) || this.selectedTrackId || 1;
      this.selectedTrackId = trackId;
      if (this.onGameStart) this.onGameStart({ trackId, ...(data.config || {}) });
    } else if (data.type === 'SNAPSHOT') {
      if (this.onSnapshot) this.onSnapshot(data);
    } else if (data.type === 'GAME_OVER') {
      if (this.onGameOver) this.onGameOver(data.results);
    }
  }

  broadcastTrackChange(trackId) {
    this.selectedTrackId = trackId;
    if (!this.isHost) return;
    this._broadcastToGuests({ type: 'TRACK_CHANGE', trackId });
  }

  broadcastGameStart(config = {}) {
    if (!this.isHost) return;
    const fullConfig = { trackId: this.selectedTrackId || 1, ...config };
    this._broadcastToGuests({ type: 'GAME_START', config: fullConfig, trackId: this.selectedTrackId || 1 });
  }

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    this._broadcastToGuests({ type: 'SNAPSHOT', snapshot });
  }

  sendClientInput(input) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;
    this.hostConnection.send({ type: 'CLIENT_INPUT', input });
  }

  broadcastGameOver(results) {
    if (!this.isHost) return;
    this._broadcastToGuests({ type: 'GAME_OVER', results });
  }

  _broadcastToGuests(msg) {
    this.connections.forEach(conn => {
      if (conn && conn.open) {
        conn.send(msg);
      }
    });
  }

  disconnect() {
    this._stopHeartbeat();
    if (this.hostConnection) {
      try { this.hostConnection.close(); } catch (e) {}
      this.hostConnection = null;
    }
    this.connections.forEach(conn => {
      try { conn.close(); } catch (e) {}
    });
    this.connections.clear();

    if (this.peer && !this.peer.destroyed) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }

    this.isHost = false;
    this.roomCode = '';
    this.lobbyPlayers = [];
    this.selectedTrackId = 1;
  }
}

export const microKartNet = new MicroKartNetworkManager();
