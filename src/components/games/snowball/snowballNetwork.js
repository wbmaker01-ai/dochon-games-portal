// Dochon Games Portal - Snowball Survival WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1234', '7788') to 'dochon-snow-XXXX' Peer ID

import { Peer } from 'peerjs';
import { SNOWBALL_PEER_PREFIX } from './snowballConstants';

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
  }

  // Generate random 4-digit numeric code
  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // --- HOST: Create a P2P Room ---
  createRoom(numericCode, playerName, skinId = 'penguin') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = String(numericCode).trim().padStart(4, '0').slice(0, 4);
      this.roomCode = cleanCode;
      this.isHost = true;
      this.myName = playerName || '방장';
      this.mySkinId = skinId;
      const fullPeerId = `${SNOWBALL_PEER_PREFIX}${cleanCode}`;

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
              id: this.myPeerId,
              name: this.myName,
              skinId: this.mySkinId,
              isHost: true,
              isReady: true,
              slotIndex: 0
            }
          ];
          if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
          resolve(this.roomCode);
        });

        this.peer.on('connection', (conn) => {
          this._handleIncomingConnection(conn);
        });

        this.peer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
            reject(new Error(`이미 사용 중인 방 번호(${cleanCode})입니다. 다른 번호를 입력하세요.`));
          } else {
            reject(new Error(`P2P 네트워크 연결 오류: ${err.message || err.type}`));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  _handleIncomingConnection(conn) {
    if (!this.isHost) return;

    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

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
        if (conn) {
          conn.send({ type: 'JOIN_REJECTED', reason: '방 인원이 가득 찼습니다 (최대 8인).' });
          conn.close();
        }
        return;
      }

      const newSlot = this.lobbyPlayers.length;
      const newPlayer = {
        id: senderPeerId,
        name: data.playerName || `참가자${newSlot + 1}`,
        skinId: data.skinId || 'snowman',
        isHost: false,
        isReady: true,
        slotIndex: newSlot
      };

      this.lobbyPlayers.push(newPlayer);
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
      // Forward client input or trigger local logic
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

  // --- GUEST: Join Room ---
  joinRoom(numericCode, playerName, skinId = 'snowman') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = String(numericCode).trim().padStart(4, '0').slice(0, 4);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = playerName || '참가자';
      this.mySkinId = skinId;
      const targetHostPeerId = `${SNOWBALL_PEER_PREFIX}${cleanCode}`;

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
          const conn = this.peer.connect(targetHostPeerId, { reliable: true });
          this.hostConnection = conn;

          const connectionTimeout = setTimeout(() => {
            reject(new Error(`방(${cleanCode})을 찾을 수 없거나 응답이 없습니다. 번호를 확인하세요.`));
          }, 8000);

          conn.on('open', () => {
            clearTimeout(connectionTimeout);
            conn.send({
              type: 'JOIN_LOBBY',
              playerName: this.myName,
              skinId: this.mySkinId
            });
            resolve(cleanCode);
          });

          conn.on('data', (data) => {
            this._handleGuestReceivedData(data);
          });

          conn.on('close', () => {
            if (this.onDisconnect) this.onDisconnect('방장과의 연결이 끊어졌습니다.');
          });

          conn.on('error', (err) => {
            reject(new Error(`방 연결 실패: ${err.message || '방이 존재하지 않습니다.'}`));
          });
        });

        this.peer.on('error', (err) => {
          reject(new Error(`P2P 네트워크 초기화 실패: ${err.message || err.type}`));
        });
      } catch (err) {
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
