// Dochon Games Portal - Snowball Survival WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-snow-XXXX' Peer ID
// v2: SchoolNet / Symmetric NAT Traversal with Metered TURN Relays (Ports 80/443) & Handshake Retries

import { Peer } from 'peerjs';
import { SNOWBALL_PEER_PREFIX } from './snowballConstants';

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
  // Public OpenRelay Backup Servers
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
const MAX_CONNECT_RETRIES = 3;

export class SnowballNetworkManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'penguin';
    this.connections = new Map(); // For host: peerId -> conn
    this.hostConnection = null;   // For guest: conn to host
    this.heartbeatTimer = null;   // WebSocket keep-alive timer

    this.lobbyPlayers = [];       // [{ id, name, skinId, isHost, isReady, slotIndex }]

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
  }

  // Generate random 4-digit numeric code
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // Emit status message for user UI feedback
  _emitStatus(message) {
    if (this.onConnectionStatus) this.onConnectionStatus(message);
  }

  // Clean numeric code string
  static cleanCode(code) {
    const digits = String(code || '').replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 4);
  }

  // Start periodic heartbeat to prevent signaling server disconnects
  _startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected) {
          console.warn('[P2P] Peer disconnected from signaling server, reconnecting...');
          try {
            this.peer.reconnect();
          } catch (err) {
            console.error('[P2P] Reconnect error:', err);
          }
        }
      }
    }, 10000);
  }

  // --- HOST: Create a P2P Room ---
  createRoom(numericCode, playerName, skinId = 'penguin') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = SnowballNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = true;
      this.myName = playerName || '방장';
      this.mySkinId = skinId;
      let autoRetryCount = 0;

      const attemptHostInit = (codeToTry) => {
        const fullPeerId = `${SNOWBALL_PEER_PREFIX}${codeToTry}`;
        this.roomCode = codeToTry;
        this._emitStatus(`🔗 P2P 시그널링 서버에 방(${codeToTry}) 등록 중...`);

        try {
          this.peer = new Peer(fullPeerId, {
            debug: 0,
            config: {
              iceServers: ICE_SERVERS,
              iceCandidatePoolSize: 10
            }
          });

          this.peer.on('open', (id) => {
            clearTimeout(timeoutId);
            this.myPeerId = id;
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
            this._startHeartbeat();
            this._emitStatus(`✅ 방(${codeToTry}) 개설 완료! 참가자를 기다리는 중...`);
            if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
            resolve(this.roomCode);
          });

          this.peer.on('connection', (conn) => {
            this._emitStatus(`👋 새로운 친구가 접속을 시도합니다...`);
            this._handleIncomingConnection(conn);
          });

          this.peer.on('disconnected', () => {
            console.warn('[P2P Host] Disconnected from signaling server. Auto-reconnecting...');
            if (this.peer && !this.peer.destroyed) {
              try {
                this.peer.reconnect();
              } catch (e) {
                console.error('[P2P Host] Reconnect failed:', e);
              }
            }
          });

          this.peer.on('error', (err) => {
            console.warn('[P2P Host Error]', err.type, err);
            if (err.type === 'unavailable-id') {
              if (autoRetryCount < 2) {
                autoRetryCount++;
                const newCode = SnowballNetworkManager.generateRandomCode();
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

  _handleIncomingConnection(conn) {
    if (!this.isHost) return;

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this._emitStatus(`⚡ 친구와 P2P 터널 연결 수립 완료!`);

      conn.on('data', (data) => {
        this._handleHostReceivedData(conn.peer, data);
      });

      conn.on('close', () => {
        this._handlePlayerLeave(conn.peer);
      });

      conn.on('error', () => {
        this._handlePlayerLeave(conn.peer);
      });
    });
  }

  _handleHostReceivedData(senderPeerId, data) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN_LOBBY') {
      if (this.lobbyPlayers.length >= 8) {
        const conn = this.connections.get(senderPeerId);
        if (conn && conn.open) {
          conn.send({ type: 'JOIN_REJECTED', reason: '방 인원이 가득 찼습니다 (최대 8인).' });
          conn.close();
        }
        return;
      }

      // Check if already in lobby (prevent duplicate entries on retry)
      let player = this.lobbyPlayers.find(p => p.id === senderPeerId);
      if (!player) {
        const newSlot = this.lobbyPlayers.length;
        player = {
          id: senderPeerId,
          name: data.playerName || `참가자${newSlot + 1}`,
          skinId: data.skinId || 'snowman',
          isHost: false,
          isReady: true,
          slotIndex: newSlot
        };
        this.lobbyPlayers.push(player);
      } else {
        // Update info if existing
        player.name = data.playerName || player.name;
        player.skinId = data.skinId || player.skinId;
      }

      // Immediately ACK to the joining guest and broadcast to all
      const conn = this.connections.get(senderPeerId);
      if (conn && conn.open) {
        conn.send({
          type: 'LOBBY_STATE',
          players: this.lobbyPlayers,
          roomCode: this.roomCode,
          isAck: true
        });
      }

      this._broadcastToAll({
        type: 'LOBBY_STATE',
        players: this.lobbyPlayers,
        roomCode: this.roomCode
      });
      if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
    } else if (data.type === 'CHANGE_SKIN') {
      const p = this.lobbyPlayers.find(pl => pl.id === senderPeerId);
      if (p) {
        p.skinId = data.skinId;
        this._broadcastToAll({
          type: 'LOBBY_STATE',
          players: this.lobbyPlayers,
          roomCode: this.roomCode
        });
        if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
      }
    } else if (data.type === 'CLIENT_INPUT') {
      if (this.onClientInput) {
        this.onClientInput(senderPeerId, data);
      }
    }
  }

  _handlePlayerLeave(peerId) {
    if (!this.isHost) return;
    this.connections.delete(peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter(p => p.id !== peerId);

    this._broadcastToAll({
      type: 'LOBBY_STATE',
      players: this.lobbyPlayers,
      roomCode: this.roomCode
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- GUEST: Join Room with Auto-Retry and Handshake ---
  joinRoom(numericCode, playerName, skinId = 'snowman') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = SnowballNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = playerName || '참가자';
      this.mySkinId = skinId;
      const targetHostPeerId = `${SNOWBALL_PEER_PREFIX}${cleanCode}`;

      this._emitStatus(`🔍 방(${cleanCode}) 찾는 중... 방화벽/TURN 우회 탐색`);

      let handshakeTimer = null;
      let isResolved = false;
      let retryAttempts = 0;
      let activeConn = null;

      const connectionTimeout = setTimeout(() => {
        if (handshakeTimer) clearInterval(handshakeTimer);
        if (!isResolved) {
          this._emitStatus(`⏰ 방(${cleanCode}) 연결 시간 초과`);
          this.disconnect();
          reject(new Error(`방(${cleanCode})을 찾을 수 없습니다. 방장이 방을 먼저 열었는지 확인해 주세요.`));
        }
      }, CONNECTION_TIMEOUT_MS);

      const attemptConnect = (peerInstance) => {
        if (isResolved) return;
        this._emitStatus(`🤝 방장과 P2P 연결 시도 중... (${retryAttempts + 1}/${MAX_CONNECT_RETRIES + 1})`);

        try {
          if (activeConn) {
            try { activeConn.close(); } catch { /* ignore */ }
          }

          const conn = peerInstance.connect(targetHostPeerId, {
            reliable: true
          });
          activeConn = conn;
          this.hostConnection = conn;

          conn.on('open', () => {
            this._emitStatus(`⚡ P2P 채널 연결 성공! 대기실 입장 요청 전송 중...`);

            const sendJoin = () => {
              if (conn.open) {
                conn.send({
                  type: 'JOIN_LOBBY',
                  playerName: this.myName,
                  skinId: this.mySkinId
                });
              }
            };
            sendJoin();

            // Handshake Keep-Alive Retry: repeat every 350ms until LOBBY_STATE received
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
            if (data.type === 'LOBBY_STATE' && !isResolved) {
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
            if (this.onDisconnect) this.onDisconnect('방장과의 연결이 끊어졌습니다.');
          });

          conn.on('error', (err) => {
            console.warn('[P2P Guest Conn Error]', err);
            // If not resolved and retries remain, try again
            if (!isResolved && retryAttempts < MAX_CONNECT_RETRIES) {
              retryAttempts++;
              setTimeout(() => attemptConnect(peerInstance), 1200);
            }
          });
        } catch (err) {
          console.error('[P2P Connect Exception]', err);
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
          console.warn('[P2P Guest Peer Error]', err.type, err);
          if (!isResolved && retryAttempts < MAX_CONNECT_RETRIES) {
            retryAttempts++;
            const reason = err.type === 'peer-unavailable' ? '방장이 준비 중입니다' : '방화벽/네트워크 탐색 중';
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
        if (handshakeTimer) clearInterval(handshakeTimer);
        reject(err);
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
  }

  // --- Host sends Game Snapshot (20Hz) ---
  hostBroadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    this._broadcastToAll({
      type: 'GAME_SNAPSHOT',
      ...snapshot
    });
  }

  // --- Guest sends Input to Host ---
  guestSendInput(inputData) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;
    this.hostConnection.send({
      type: 'CLIENT_INPUT',
      ...inputData
    });
  }

  // --- Change Skin in Lobby ---
  changeSkin(skinId) {
    this.mySkinId = skinId;
    if (this.isHost) {
      const p = this.lobbyPlayers.find(pl => pl.id === this.myPeerId);
      if (p) p.skinId = skinId;
      this._broadcastToAll({
        type: 'LOBBY_STATE',
        players: this.lobbyPlayers,
        roomCode: this.roomCode
      });
      if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'CHANGE_SKIN',
        skinId
      });
    }
  }

  _broadcastToAll(payload) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(payload);
      }
    });
  }

  disconnect() {
    try {
      this.connections.forEach(conn => conn.close());
      this.connections.clear();
      if (this.hostConnection) {
        this.hostConnection.close();
        this.hostConnection = null;
      }
      if (this.peer) {
        this.peer.destroy();
        this.peer = null;
      }
    } catch {
      // Ignore cleanup error
    }
    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.lobbyPlayers = [];
  }
}

export const snowballNet = new SnowballNetworkManager();
