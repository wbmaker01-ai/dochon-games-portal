// Dochon Games Portal - The Great Ghoul Duel WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-ghoul-XXXX' Peer ID

import { Peer } from 'peerjs';

const PEER_PREFIX = 'dochon-ghoul-';

class GhoulDuelNetworkManager {
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
    this.onError = null;
    this.onDisconnect = null;
  }

  // Generate a random 4-digit numeric room code (e.g. 1000 ~ 9999)
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
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

      try {
        this.peer = new Peer(fullPeerId, {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
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
          if (this.onLobbyUpdate) this.onLobbyUpdate(this.lobbyPlayers);
          resolve(cleanCode);
        });

        this.peer.on('connection', (conn) => {
          this.handleHostIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Host Error:', err);
          if (err.type === 'unavailable-id') {
            const errorMsg = `이미 사용 중인 4자리 방 번호(${cleanCode})입니다. 다른 번호를 입력해주세요.`;
            if (this.onError) this.onError(errorMsg);
            reject(new Error(errorMsg));
          } else {
            const errorMsg = 'P2P 네트워크 연결 오류가 발생했습니다.';
            if (this.onError) this.onError(errorMsg);
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  handleHostIncomingConnection(conn) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

      conn.on('data', (data) => {
        this.handleHostReceiveData(conn.peer, data);
      });

      conn.on('close', () => {
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
    this.connections.delete(peerId);
    this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== peerId);
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

  // --- GUEST: Join a P2P Room ---
  joinRoom(numericCode, playerName, team = 'green') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = String(numericCode).trim().padStart(4, '0').slice(0, 4);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = playerName || '도촌 학생';
      this.myTeam = team;
      const targetHostPeerId = `${PEER_PREFIX}${cleanCode}`;

      try {
        this.peer = new Peer({
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          // Connect to Host
          const conn = this.peer.connect(targetHostPeerId, { reliable: false });
          this.hostConnection = conn;

          conn.on('open', () => {
            // Send Join packet
            conn.send({
              type: 'JOIN',
              name: this.myName,
              team: this.myTeam
            });
            resolve(cleanCode);
          });

          conn.on('data', (data) => {
            this.handleGuestReceiveData(data);
          });

          conn.on('close', () => {
            const errorMsg = '방장과의 연결이 끊어졌습니다.';
            if (this.onDisconnect) this.onDisconnect(errorMsg);
          });

          conn.on('error', (err) => {
            console.error('Guest Connection Error:', err);
            reject(err);
          });
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Guest Error:', err);
          const errorMsg = `방 번호 [${cleanCode}]를 찾을 수 없거나 연결할 수 없습니다.`;
          if (this.onError) this.onError(errorMsg);
          reject(new Error(errorMsg));
        });
      } catch (err) {
        reject(err);
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
