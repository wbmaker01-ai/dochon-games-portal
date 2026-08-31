// Dochon Games Portal - The Great Ghoul Duel WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-ghoul-XXXX' Peer ID
// v2: TURN relay servers added for school/corporate NAT traversal

import { Peer } from 'peerjs';

const PEER_PREFIX = 'dochon-ghoul-';

// ICE Servers: STUN (public IP discovery) + TURN (relay fallback for restrictive NATs)
// Uses Metered Open Relay (free 20GB/month) on ports 80/443 to bypass school firewalls
const ICE_SERVERS = [
  // STUN servers for basic NAT traversal
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.relay.metered.ca:80' },
  // TURN relay servers (critical for school networks with symmetric NAT/firewalls)
  // Port 80 (HTTP) and 443 (HTTPS) are almost never blocked by school firewalls
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
  }
];

const CONNECTION_TIMEOUT_MS = 15000; // 15 seconds connection timeout
const MAX_RETRY_ATTEMPTS = 2; // Additional retry attempts after first failure

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
    this.onConnectionStatus = null; // NEW: status messages for UI feedback
  }

  // Generate a random 4-digit numeric room code (e.g. 1000 ~ 9999)
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // Emit a user-facing connection status message
  _emitStatus(message) {
    if (this.onConnectionStatus) this.onConnectionStatus(message);
  }

  // --- HOST: Create a P2P Room ---
  createRoom(numericCode, playerName, team = 'green') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = String(numericCode).trim().padStart(4, '0').slice(0, 4);
      this.roomCode = cleanCode;
      this.isHost = true;
      this.myName = playerName || '방장';
      this.myTeam = team;
      const fullPeerId = `${PEER_PREFIX}${cleanCode}`;

      this._emitStatus('🔗 시그널링 서버에 연결 중...');

      // Timeout for signaling server connection
      const timeoutId = setTimeout(() => {
        this._emitStatus('⏰ 연결 시간 초과! 네트워크 상태를 확인해 주세요.');
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
            iceCandidatePoolSize: 10
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
          this._emitStatus('✅ 방이 생성되었습니다! 친구들의 접속을 기다리는 중...');
          if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
          resolve(cleanCode);
        });

        this.peer.on('connection', (conn) => {
          this._emitStatus(`👋 새로운 친구가 접속 중...`);
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
          // Signaling server disconnected, attempt to reconnect
          this._emitStatus('⚠️ 시그널링 서버와 연결이 끊겼습니다. 재연결 시도 중...');
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch (e) {
              console.error('Reconnect failed:', e);
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
    // Timeout for data channel opening
    const connTimeoutId = setTimeout(() => {
      console.warn('Incoming connection timed out for peer:', conn.peer);
    }, CONNECTION_TIMEOUT_MS);

    conn.on('open', () => {
      clearTimeout(connTimeoutId);
      this.connections.set(conn.peer, conn);
      this._emitStatus(`✅ 친구가 연결되었습니다!`);

      conn.on('data', (data) => {
        this.handleHostReceiveData(conn.peer, data);
      });

      conn.on('close', () => {
        this.handlePeerLeave(conn.peer);
      });

      conn.on('error', (err) => {
        console.error('Host connection error with peer:', conn.peer, err);
        this.handlePeerLeave(conn.peer);
      });
    });
  }

  handleHostReceiveData(peerId, data) {
    if (!data || !data.type) return;

    if (data.type === 'JOIN') {
      // Find empty slot (max 8 players total)
      if (this.lobbyPlayers.length >= 8) {
        const conn = this.connections.get(peerId);
        if (conn) conn.send({ type: 'ERROR', message: '방이 가득 찼습니다. (최대 8명)' });
        return;
      }

      // Balance teams if not specified
      const greenCount = this.lobbyPlayers.filter((p) => p.team === 'green').length;
      const purpleCount = this.lobbyPlayers.filter((p) => p.team === 'purple').length;
      const assignedTeam = data.team || (greenCount <= purpleCount ? 'green' : 'purple');

      const newPlayer = {
        id: peerId,
        name: data.name || `친구-${this.lobbyPlayers.length + 1}`,
        team: assignedTeam,
        isHost: false,
        isReady: true,
        slotIndex: this.lobbyPlayers.length
      };

      this.lobbyPlayers.push(newPlayer);
      this._emitStatus(`🎉 ${newPlayer.name}님이 ${assignedTeam === 'green' ? '초록 영혼팀' : '보라 유령팀'}에 합류!`);
      this.broadcastLobbyUpdate();
    } else if (data.type === 'TOGGLE_TEAM') {
      const player = this.lobbyPlayers.find((p) => p.id === peerId);
      if (player) {
        player.team = player.team === 'green' ? 'purple' : 'green';
        this.broadcastLobbyUpdate();
      }
    } else if (data.type === 'INPUT') {
      // Forward input directly to game logic engine via onGuestInput
      if (this.onGuestInput) {
        this.onGuestInput(peerId, data.vector, data.angle);
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

  // --- GUEST: Join a P2P Room (with retry logic) ---
  joinRoom(numericCode, playerName, team = 'green') {
    return this._joinRoomAttempt(numericCode, playerName, team, 0);
  }

  _joinRoomAttempt(numericCode, playerName, team, attempt) {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = String(numericCode).trim().padStart(4, '0').slice(0, 4);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = playerName || '도촌 학생';
      this.myTeam = team;
      const targetHostPeerId = `${PEER_PREFIX}${cleanCode}`;

      const attemptLabel = attempt > 0 ? ` (재시도 ${attempt}/${MAX_RETRY_ATTEMPTS})` : '';
      this._emitStatus(`🔗 시그널링 서버에 연결 중...${attemptLabel}`);

      let settled = false; // Prevent double resolve/reject
      let timeoutId = null;

      const settle = (type, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        if (type === 'resolve') resolve(value);
        else reject(value);
      };

      try {
        this.peer = new Peer({
          debug: 1,
          config: {
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 10
          }
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          this._emitStatus(`🔍 방 번호 [${cleanCode}]을 찾는 중...${attemptLabel}`);

          // Connect to Host with reliable data channel
          const conn = this.peer.connect(targetHostPeerId, { reliable: true });
          this.hostConnection = conn;

          // Overall connection timeout (signaling + ICE + data channel)
          timeoutId = setTimeout(() => {
            if (!settled) {
              console.warn(`Connection attempt ${attempt + 1} timed out`);

              // Retry logic
              if (attempt < MAX_RETRY_ATTEMPTS) {
                this._emitStatus(`⏰ 연결 시간 초과. 자동으로 재시도합니다... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
                this.disconnect();
                // Retry after a short delay
                setTimeout(() => {
                  this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                    .then(resolve)
                    .catch(reject);
                }, 1500);
              } else {
                const errorMsg = `방 번호 [${cleanCode}]에 연결할 수 없습니다.\n\n💡 해결 방법:\n1. 방장이 방을 열었는지 확인해 주세요\n2. 방 번호를 다시 확인해 주세요\n3. 같은 와이파이에 연결되어 있는지 확인해 주세요\n4. 방장에게 방을 다시 만들어 달라고 요청해 주세요`;
                this._emitStatus(`❌ 연결 실패. 방 번호와 네트워크를 확인해 주세요.`);
                if (this.onError) this.onError(errorMsg);
                settle('reject', new Error(errorMsg));
              }
            }
          }, CONNECTION_TIMEOUT_MS);

          conn.on('open', () => {
            this._emitStatus('✅ 방장에게 연결되었습니다!');
            // Send Join packet
            conn.send({
              type: 'JOIN',
              name: this.myName,
              team: this.myTeam
            });
            settle('resolve', cleanCode);
          });

          conn.on('data', (data) => {
            this.handleGuestReceiveData(data);
          });

          conn.on('close', () => {
            const errorMsg = '방장과의 연결이 끊어졌습니다.';
            this._emitStatus(`⚠️ ${errorMsg}`);
            if (this.onDisconnect) this.onDisconnect(errorMsg);
          });

          conn.on('error', (err) => {
            console.error('Guest Connection Error:', err);
            if (!settled && attempt < MAX_RETRY_ATTEMPTS) {
              this._emitStatus(`⚠️ 연결 오류 발생. 재시도 중... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
              this.disconnect();
              setTimeout(() => {
                this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, 1500);
            } else {
              settle('reject', err);
            }
          });
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Guest Error:', err);
          if (err.type === 'peer-unavailable') {
            // The host peer ID doesn't exist on the signaling server
            if (!settled && attempt < MAX_RETRY_ATTEMPTS) {
              this._emitStatus(`⚠️ 방을 찾을 수 없습니다. 재시도 중... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
              this.disconnect();
              setTimeout(() => {
                this._joinRoomAttempt(numericCode, playerName, team, attempt + 1)
                  .then(resolve)
                  .catch(reject);
              }, 2000);
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
          this._emitStatus('⚠️ 시그널링 서버와 연결이 끊겼습니다. 재연결 시도 중...');
          if (this.peer && !this.peer.destroyed) {
            try {
              this.peer.reconnect();
            } catch (e) {
              console.error('Reconnect failed:', e);
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

  // Send player input from Guest to Host
  sendInput(vector, angle) {
    if (!this.isHost && this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({
        type: 'INPUT',
        vector,
        angle
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
