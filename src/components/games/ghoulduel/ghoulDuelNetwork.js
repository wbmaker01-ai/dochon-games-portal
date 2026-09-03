// Dochon Games Portal - The Great Ghoul Duel WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-ghoul-XXXX' Peer ID
// v4: High-Reliability P2P Connection (Keep-Alive, Zero-Loss Data Listener, Fallback TURN/STUN, Position Sync)

import { Peer } from 'peerjs';

const PEER_PREFIX = 'dochon-ghoul-';

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
    urls: 'turn:openrelay.metered.ca:80?transport=tcp',
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

const CONNECTION_TIMEOUT_MS = 18000; // 18 seconds overall connection timeout
const MAX_CONNECTION_RETRIES = 3;   // Re-attempt connect up to 3 times
const HANDSHAKE_INTERVAL_MS = 400;  // Re-send JOIN_LOBBY every 400ms
const MAX_HANDSHAKE_ATTEMPTS = 10;  // Up to 10 handshake attempts (4.0s total)

export class GhoulDuelNetworkManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.myTeam = 'green';
    this.connections = new Map(); // For host: peerId -> conn
    this.hostConnection = null;   // For guest: conn to host

    this.lobbyPlayers = [];       // [{ id, name, team, isHost, isReady, slotIndex }]

    // Event Callbacks
    this.onLobbyUpdate = null;
    this.onGameStart = null;
    this.onSnapshot = null;
    this.onGameOver = null;
    this.onError = null;
    this.onDisconnect = null;
    this.onConnectionStatus = null; // Status messages for UI feedback
    this.onGuestInput = null;

    // Handshake & Keep-Alive internal state
    this._handshakeInterval = null;
    this._keepAliveTimer = null;
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

  // Clear active handshake retry interval
  _clearHandshakeTimer() {
    if (this._handshakeInterval) {
      clearInterval(this._handshakeInterval);
      this._handshakeInterval = null;
    }
  }

  // Heartbeat keep-alive to keep signaling WebSocket open on Host
  _startKeepAlive() {
    this._stopKeepAlive();
    this._keepAliveTimer = setInterval(() => {
      if (this.peer && !this.peer.destroyed) {
        if (this.peer.disconnected) {
          try {
            this.peer.reconnect();
          } catch (e) {
            console.warn('Keep-alive reconnect attempt failed:', e);
          }
        } else if (
          this.peer.socket &&
          this.peer.socket._ws &&
          this.peer.socket._ws.readyState === 1 /* OPEN */
        ) {
          try {
            this.peer.socket._ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
          } catch (e) {}
        }
      }
    }, 12000);
  }

  _stopKeepAlive() {
    if (this._keepAliveTimer) {
      clearInterval(this._keepAliveTimer);
      this._keepAliveTimer = null;
    }
  }

  // --- HOST: Create a P2P Room ---
  createRoom(numericCode, playerName, team = 'green') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = GhoulDuelNetworkManager.sanitizeCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = true;
      this.myName = (playerName || '방장').trim();
      this.myTeam = team;
      const fullPeerId = `${PEER_PREFIX}${cleanCode}`;

      this._emitStatus('🔗 시그널링 서버 연결 중...');

      // Timeout for signaling server connection
      const timeoutId = setTimeout(() => {
        this._emitStatus('⏰ 시그널링 서버 연결 시간 초과! 네트워크 상태를 확인해 주세요.');
        const errorMsg = '시그널링 서버 연결 시간 초과 (15초). 인터넷 연결을 확인하고 다시 시도해 주세요.';
        if (this.onError) this.onError(errorMsg);
        this.disconnect();
        reject(new Error(errorMsg));
      }, CONNECTION_TIMEOUT_MS);

      try {
        this.peer = new Peer(fullPeerId, {
          debug: 1,
          config: {
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 2 // Lean candidate pool to prevent socket exhaustion on low-spec devices
          }
        });

        this.peer.on('open', (id) => {
          clearTimeout(timeoutId);
          this.myPeerId = id;
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
          this._startKeepAlive();
          this._emitStatus('✅ 방이 생성되었습니다! 친구들의 접속을 기다리는 중...');
          if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
          resolve(cleanCode);
        });

        this.peer.on('connection', (conn) => {
          this._emitStatus(`👋 새로운 친구가 연결을 요청했습니다...`);
          this.handleHostIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          clearTimeout(timeoutId);
          console.error('PeerJS Host Error:', err);
          if (err.type === 'unavailable-id') {
            const errorMsg = `이미 사용 중인 4자리 방 번호(${cleanCode})입니다. 다른 번호를 입력해주세요.`;
            this._emitStatus(`❌ ${errorMsg}`);
            if (this.onError) this.onError(errorMsg);
            reject(new Error(errorMsg));
          } else if (err.type === 'network' || err.type === 'server-error') {
            const errorMsg = '시그널링 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
            this._emitStatus(`❌ ${errorMsg}`);
            if (this.onError) this.onError(errorMsg);
            reject(new Error(errorMsg));
          } else {
            const errorMsg = `P2P 네트워크 연결 오류: ${err.type || '알 수 없는 오류'}`;
            this._emitStatus(`❌ ${errorMsg}`);
            if (this.onError) this.onError(errorMsg);
            reject(err);
          }
        });

        this.peer.on('disconnected', () => {
          this._emitStatus('⚠️ 시그널링 서버와 일시적으로 연결이 끊겼습니다. 자동 복구 중...');
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch (e) {
              console.error('Host reconnect failed:', e);
            }
          }
        });
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  }

  handleHostIncomingConnection(conn) {
    const connTimeoutId = setTimeout(() => {
      console.warn('Incoming connection timed out for peer:', conn.peer);
    }, CONNECTION_TIMEOUT_MS);

    // CRITICAL: Attach data and close handlers IMMEDIATELY to prevent missed early packets
    conn.on('data', (data) => {
      this.handleHostReceiveData(conn.peer, data, conn);
    });

    conn.on('open', () => {
      clearTimeout(connTimeoutId);
      this.connections.set(conn.peer, conn);
      this._emitStatus(`⚡ 친구와 P2P 터널 연결 수립 완료! 입장 확인 대기 중...`);
    });

    conn.on('close', () => {
      clearTimeout(connTimeoutId);
      this.handlePeerLeave(conn.peer);
    });

    conn.on('error', (err) => {
      clearTimeout(connTimeoutId);
      console.error('Host connection error with peer:', conn.peer, err);
      this.handlePeerLeave(conn.peer);
    });
  }

  handleHostReceiveData(peerId, data, conn) {
    if (!data || !data.type) return;

    // Handle 3-Way Handshake: JOIN_LOBBY (or legacy JOIN)
    if (data.type === 'JOIN_LOBBY' || data.type === 'JOIN') {
      const existingPlayer = this.lobbyPlayers.find((p) => p.id === peerId);

      if (existingPlayer) {
        // Already registered -> immediately reply with ACK to satisfy retry loop
        if (conn && conn.open) {
          conn.send({
            type: 'JOIN_ACK',
            accepted: true,
            players: this.lobbyPlayers,
            assignedTeam: existingPlayer.team,
            slotIndex: existingPlayer.slotIndex
          });
        }
        return;
      }

      // Check max capacity (8 players)
      if (this.lobbyPlayers.length >= 8) {
        if (conn && conn.open) {
          conn.send({
            type: 'JOIN_ACK',
            accepted: false,
            message: '방이 가득 찼습니다. (최대 8명)'
          });
        }
        return;
      }

      // Team balancing
      const greenCount = this.lobbyPlayers.filter((p) => p.team === 'green').length;
      const purpleCount = this.lobbyPlayers.filter((p) => p.team === 'purple').length;
      const assignedTeam = data.team || (greenCount <= purpleCount ? 'green' : 'purple');

      const newPlayer = {
        id: peerId,
        name: (data.name || `친구-${this.lobbyPlayers.length + 1}`).trim(),
        team: assignedTeam,
        isHost: false,
        isReady: true,
        slotIndex: this.lobbyPlayers.length
      };

      this.lobbyPlayers.push(newPlayer);

      // Send JOIN_ACK back to the guest
      if (conn && conn.open) {
        conn.send({
          type: 'JOIN_ACK',
          accepted: true,
          players: this.lobbyPlayers,
          assignedTeam: newPlayer.team,
          slotIndex: newPlayer.slotIndex
        });
      }

      this._emitStatus(`🎉 ${newPlayer.name}님이 ${assignedTeam === 'green' ? '초록 영혼팀' : '보라 유령팀'}에 합류!`);
      this.broadcastLobbyUpdate();
    } else if (data.type === 'TOGGLE_TEAM') {
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
    const leaving = this.lobbyPlayers.find((p) => p.id === peerId);
    this.connections.delete(peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);
    if (leaving) {
      this._emitStatus(`👋 ${leaving.name}님이 나갔습니다.`);
    }
    this.broadcastLobbyUpdate();
    if (this.onPeerLeft) this.onPeerLeft(peerId);
  }

  broadcastLobbyUpdate() {
    if (!this.isHost) return;
    const packet = { type: 'LOBBY_UPDATE', players: this.lobbyPlayers };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
  }

  broadcastGameStart(seed = Date.now()) {
    if (!this.isHost) return;
    const packet = {
      type: 'START_GAME',
      seed,
      players: this.lobbyPlayers
    };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
  }

  broadcastSnapshot(snapshot) {
    if (!this.isHost) return;
    const packet = {
      type: 'SNAPSHOT',
      snapshot
    };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
  }

  broadcastGameOver(stats) {
    if (!this.isHost) return;
    const packet = {
      type: 'GAME_OVER',
      stats
    };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
  }

  // --- GUEST: Join a P2P Room (with 3-Way Handshake + Auto-Retry) ---
  joinRoom(numericCode, playerName, team = 'green') {
    return this._joinRoomAttempt(numericCode, playerName, team, 0);
  }

  _joinRoomAttempt(numericCode, playerName, team, attempt) {
    return new Promise((resolve, reject) => {
      this._clearHandshakeTimer();

      const cleanCode = GhoulDuelNetworkManager.sanitizeCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = (playerName || '도촌 학생').trim();
      this.myTeam = team;
      const targetHostPeerId = `${PEER_PREFIX}${cleanCode}`;

      const attemptLabel = attempt > 0 ? ` (재시도 ${attempt}/${MAX_CONNECTION_RETRIES})` : '';
      this._emitStatus(`🔗 시그널링 서버 연결 중...${attemptLabel}`);

      let settled = false; // Prevent duplicate resolve/reject
      let timeoutId = null;

      const settle = (type, value) => {
        if (settled) return;
        settled = true;
        this._clearHandshakeTimer();
        clearTimeout(timeoutId);
        if (type === 'resolve') resolve(value);
        else reject(value);
      };

      try {
        // If peer already exists and is open, reuse it instead of reconnecting from scratch!
        if (!this.peer || this.peer.destroyed) {
          this.peer = new Peer({
            debug: 1,
            config: {
              iceServers: ICE_SERVERS,
              iceCandidatePoolSize: 2
            }
          });
        }

        const initiateConnection = () => {
          this._emitStatus(`🔍 방장 찾는 중... (방 번호: [${cleanCode}])${attemptLabel}`);

          // Close any dangling previous connection
          if (this.hostConnection) {
            try {
              this.hostConnection.close();
            } catch (e) {}
            this.hostConnection = null;
          }

          const conn = this.peer.connect(targetHostPeerId, { reliable: true });
          this.hostConnection = conn;

          // Timeout for handshake completion
          timeoutId = setTimeout(() => {
            if (!settled) {
              this._clearHandshakeTimer();
              console.warn(`Connection attempt ${attempt + 1} timed out`);

              if (attempt < MAX_CONNECTION_RETRIES) {
                this._emitStatus(`⏰ 연결 시간 초과. 자동으로 재시도합니다... (${attempt + 1}/${MAX_CONNECTION_RETRIES})`);
                setTimeout(() => {
                  this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                    .then(resolve)
                    .catch(reject);
                }, 1200);
              } else {
                const errorMsg = `방 번호 [${cleanCode}]에 연결할 수 없습니다.\n\n💡 해결 방법:\n1. 방장이 방을 열었는지 확인해 주세요\n2. 방 번호(4자리)를 다시 확인해 주세요\n3. 방장에게 방 번호를 확인해 주세요`;
                this._emitStatus(`❌ 연결 실패. 방 번호와 네트워크를 확인해 주세요.`);
                if (this.onError) this.onError(errorMsg);
                settle('reject', new Error(errorMsg));
              }
            }
          }, CONNECTION_TIMEOUT_MS);

          conn.on('open', () => {
            this._emitStatus('⚡ P2P 터널 수립 완료! 입장 확인 중...');

            // --- 🤝 3-Way Handshake Auto-Retry Protocol ---
            let handshakeCount = 0;

            const sendJoinPacket = () => {
              if (settled || !conn.open) return;
              handshakeCount++;
              this._emitStatus(`🤝 방장에게 입장 요청(JOIN_LOBBY) 전송 중... (${handshakeCount}/${MAX_HANDSHAKE_ATTEMPTS})`);

              conn.send({
                type: 'JOIN_LOBBY',
                name: this.myName,
                team: this.myTeam,
                peerId: this.myPeerId,
                attempt: handshakeCount
              });

              if (handshakeCount >= MAX_HANDSHAKE_ATTEMPTS) {
                this._clearHandshakeTimer();
              }
            };

            sendJoinPacket();
            this._handshakeInterval = setInterval(sendJoinPacket, HANDSHAKE_INTERVAL_MS);
          });

          conn.on('data', (data) => {
            if (!data || !data.type) return;

            // Handle 3-Way Handshake ACK from Host
            if (data.type === 'JOIN_ACK') {
              this._clearHandshakeTimer();

              if (data.accepted) {
                this.lobbyPlayers = data.players || [];
                if (data.assignedTeam) this.myTeam = data.assignedTeam;
                this._emitStatus('🎉 대기실 입장 완료!');
                if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
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
          });

          conn.on('close', () => {
            this._clearHandshakeTimer();
            const errorMsg = '방장과의 연결이 끊어졌습니다.';
            this._emitStatus(`⚠️ ${errorMsg}`);
            if (this.onDisconnect) this.onDisconnect(errorMsg);
          });

          conn.on('error', (err) => {
            this._clearHandshakeTimer();
            console.error('Guest Connection Error:', err);
            if (!settled && attempt < MAX_CONNECTION_RETRIES) {
              this._emitStatus(`⚠️ 연결 재시도 중... (${attempt + 1}/${MAX_CONNECTION_RETRIES})`);
              setTimeout(() => {
                this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, 1200);
            } else {
              settle('reject', err);
            }
          });
        };

        if (this.peer.open) {
          this.myPeerId = this.peer.id;
          initiateConnection();
        } else {
          this.peer.on('open', (id) => {
            this.myPeerId = id;
            initiateConnection();
          });
        }

        this.peer.on('error', (err) => {
          this._clearHandshakeTimer();
          console.error('PeerJS Guest Error:', err);
          if (err.type === 'peer-unavailable') {
            if (!settled && attempt < MAX_CONNECTION_RETRIES) {
              this._emitStatus(`⚠️ 방을 찾는 중... 재시도 (${attempt + 1}/${MAX_CONNECTION_RETRIES})`);
              setTimeout(() => {
                this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, 1500);
            } else {
              const errorMsg = `방 번호 [${cleanCode}]을 찾을 수 없습니다. 방장이 방을 열었는지 확인해 주세요.`;
              this._emitStatus(`❌ ${errorMsg}`);
              if (this.onError) this.onError(errorMsg);
              settle('reject', new Error(errorMsg));
            }
          } else {
            const errorMsg = `P2P 네트워크 오류: ${err.type || '알 수 없는 오류'}. 인터넷 연결을 확인해 주세요.`;
            this._emitStatus(`❌ ${errorMsg}`);
            if (this.onError) this.onError(errorMsg);
            settle('reject', new Error(errorMsg));
          }
        });

        this.peer.on('disconnected', () => {
          this._emitStatus('⚠️ 시그널링 서버와 일시적으로 연결이 끊겼습니다. 자동 복구 중...');
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch (e) {
              console.error('Guest reconnect failed:', e);
            }
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
    if (!this.isHost && this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'INPUT',
        ...data
      });
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
    } else if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({ type: 'TOGGLE_TEAM' });
    }
  }

  // Disconnect & cleanup
  disconnect() {
    this._clearHandshakeTimer();
    this._stopKeepAlive();

    if (this.connections) {
      this.connections.forEach((conn) => {
        try {
          conn.close();
        } catch (e) {}
      });
      this.connections.clear();
    }
    if (this.hostConnection) {
      try {
        this.hostConnection.close();
      } catch (e) {}
      this.hostConnection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch (e) {}
      this.peer = null;
    }
    this.isHost = false;
    this.lobbyPlayers = [];
  }
}

export const ghoulNet = new GhoulDuelNetworkManager();
