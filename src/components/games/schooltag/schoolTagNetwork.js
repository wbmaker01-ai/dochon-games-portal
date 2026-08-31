// Dochon Games Portal - School Tag WebRTC P2P Network Manager (Zero-Cost PeerJS)
// 4-Digit Numeric Room Code (e.g. '1024', '7788') to 'dochon-schooltag-XXXX' Peer ID

import { Peer } from 'peerjs';
import { SCHOOL_TAG_CONSTANTS, ROLE_TYPES } from './schoolTagConstants';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
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
  }
];

export class SchoolTagNetworkManager {
  constructor() {
    this.peer = null;
    this.isHost = false;
    this.roomCode = '';
    this.myPeerId = '';
    this.myName = '';
    this.mySkinId = 'boy';
    this.myRole = ROLE_TYPES.RUNNER;
    this.connections = new Map(); // For host: peerId -> conn
    this.hostConnection = null;   // For guest: conn to host

    this.lobbyPlayers = [];       // [{ id, name, skinId, role, isHost, isReady, slotIndex }]

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
  }

  static generateRandomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // Clean numeric code string
  static cleanCode(code) {
    const digits = String(code || '').replace(/[^0-9]/g, '');
    return digits.padStart(4, '0').slice(0, 4);
  }

  // --- HOST: Create a P2P Room ---
  createRoom(numericCode, playerName, role = ROLE_TYPES.TAGGER, skinId = 'ghost') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = SchoolTagNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = true;
      this.myName = playerName || '방장(당직선생님)';
      this.myRole = role;
      this.mySkinId = skinId;
      const fullPeerId = `${SCHOOL_TAG_CONSTANTS.PEER_PREFIX}${cleanCode}`;

      try {
        this.peer = new Peer(fullPeerId, {
          debug: 0,
          config: {
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 10
          },
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          this.lobbyPlayers = [
            {
              id: this.myPeerId,
              name: this.myName,
              skinId: this.mySkinId,
              role: this.myRole,
              isHost: true,
              isReady: true,
              slotIndex: 0,
            },
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
        this.connections.delete(conn.peer);
        this.lobbyPlayers = this.lobbyPlayers.filter((p) => p.id !== conn.peer);
        this._broadcastLobby();
      });
    });
  }

  _handleHostReceivedData(senderPeerId, data) {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'JOIN_LOBBY': {
        const slot = this.lobbyPlayers.length;
        if (slot >= 4) {
          const conn = this.connections.get(senderPeerId);
          if (conn) conn.send({ type: 'ROOM_FULL' });
          return;
        }

        const newPlayer = {
          id: senderPeerId,
          name: data.name || `학생 ${slot + 1}`,
          skinId: data.skinId || 'boy',
          role: ROLE_TYPES.RUNNER,
          isHost: false,
          isReady: true,
          slotIndex: slot,
        };

        this.lobbyPlayers.push(newPlayer);
        this._broadcastLobby();
        break;
      }

      case 'CLIENT_INPUT': {
        // Forward runner input to game logic in host
        if (this.onPlayerInput) {
          this.onPlayerInput(senderPeerId, data.payload);
        }
        break;
      }

      case 'CLIENT_ACTION': {
        if (this.onPlayerAction) {
          this.onPlayerAction(senderPeerId, data.payload);
        }
        break;
      }

      default:
        break;
    }
  }

  _broadcastLobby() {
    if (!this.isHost) return;
    const packet = {
      type: 'LOBBY_UPDATE',
      players: this.lobbyPlayers,
    };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onLobbyUpdate) this.onLobbyUpdate([...this.lobbyPlayers]);
  }

  // --- GUEST: Join a P2P Room ---
  joinRoom(numericCode, playerName, skinId = 'boy') {
    return new Promise((resolve, reject) => {
      this.disconnect();

      const cleanCode = SchoolTagNetworkManager.cleanCode(numericCode);
      this.roomCode = cleanCode;
      this.isHost = false;
      this.myName = playerName || '도망자';
      this.myRole = ROLE_TYPES.RUNNER;
      this.mySkinId = skinId;
      const targetHostPeerId = `${SCHOOL_TAG_CONSTANTS.PEER_PREFIX}${cleanCode}`;

      try {
        this.peer = new Peer(null, {
          debug: 0,
          config: {
            iceServers: ICE_SERVERS,
            iceCandidatePoolSize: 10
          },
        });

        this.peer.on('open', (id) => {
          this.myPeerId = id;
          const conn = this.peer.connect(targetHostPeerId, { reliable: true });
          this.hostConnection = conn;

          conn.on('open', () => {
            conn.send({
              type: 'JOIN_LOBBY',
              name: this.myName,
              skinId: this.mySkinId,
            });
            resolve(this.roomCode);
          });

          conn.on('data', (data) => {
            this._handleGuestReceivedData(data);
          });

          conn.on('close', () => {
            if (this.onDisconnect) this.onDisconnect('방장과의 연결이 종료되었습니다.');
          });

          conn.on('error', (err) => {
            reject(new Error(`방 연결 실패: ${err.message || '호스트를 찾을 수 없습니다.'}`));
          });
        });

        this.peer.on('error', (err) => {
          reject(new Error(`P2P 네트워크 오류: ${err.message || err.type}`));
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  _handleGuestReceivedData(data) {
    if (!data || !data.type) return;

    switch (data.type) {
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
        if (this.onError) this.onError('방의 인원이 가득 찼습니다. (최대 4인)');
        this.disconnect();
        break;

      default:
        break;
    }
  }

  // --- Match Control ---
  broadcastGameStart(matchData) {
    if (!this.isHost) return;
    const packet = { type: 'GAME_START', matchData };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onGameStart) this.onGameStart(matchData);
  }

  broadcastGameState(state) {
    if (!this.isHost) return;
    const packet = { type: 'GAME_STATE', state };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
  }

  broadcastTagEvent(tagData) {
    if (!this.isHost) return;
    const packet = { type: 'TAG_EVENT', ...tagData };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onTagEvent) this.onTagEvent(tagData);
  }

  broadcastKeyEvent(keyData) {
    if (!this.isHost) return;
    const packet = { type: 'KEY_COLLECTED', ...keyData };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onKeyEvent) this.onKeyEvent(keyData);
  }

  broadcastGameOver(result) {
    if (!this.isHost) return;
    const packet = { type: 'GAME_OVER', result };
    this.connections.forEach((conn) => {
      if (conn.open) conn.send(packet);
    });
    if (this.onGameOver) this.onGameOver(result);
  }

  sendClientInput(input) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;
    this.hostConnection.send({
      type: 'CLIENT_INPUT',
      payload: input,
    });
  }

  sendClientAction(action) {
    if (this.isHost || !this.hostConnection || !this.hostConnection.open) return;
    this.hostConnection.send({
      type: 'CLIENT_ACTION',
      payload: action,
    });
  }

  disconnect() {
    if (this.connections) {
      this.connections.forEach((conn) => conn.close());
      this.connections.clear();
    }
    if (this.hostConnection) {
      this.hostConnection.close();
      this.hostConnection = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
    this.lobbyPlayers = [];
    this.isHost = false;
    this.roomCode = '';
  }
}
