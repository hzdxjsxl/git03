const SocketClient = {
  socket: null,
  battleCallbacks: {},

  connect(playerId, token) {
    this.socket = io({
      auth: { playerId, token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    this.socket.on('battle:start', (data) => {
      if (this.battleCallbacks.onStart) this.battleCallbacks.onStart(data);
    });

    this.socket.on('battle:state', (data) => {
      if (this.battleCallbacks.onState) this.battleCallbacks.onState(data);
    });

    this.socket.on('battle:error', (data) => {
      if (this.battleCallbacks.onError) this.battleCallbacks.onError(data);
    });
  },

  onBattleStart(cb) { this.battleCallbacks.onStart = cb; },
  onBattleState(cb) { this.battleCallbacks.onState = cb; },
  onBattleError(cb) { this.battleCallbacks.onError = cb; },

  matchmake(deckId) {
    this.socket.emit('battle:matchmake', { deckId });
  },

  cancelMatch() {
    this.socket.emit('battle:cancelMatch');
  },

  playCard(battleId, cardUid) {
    this.socket.emit('battle:playCard', { battleId, cardUid });
  },

  attack(battleId, attackerUid, targetUid) {
    this.socket.emit('battle:attack', { battleId, attackerUid, targetUid });
  },

  endTurn(battleId) {
    this.socket.emit('battle:endTurn', { battleId });
  },

  concede(battleId) {
    this.socket.emit('battle:concede', { battleId });
  },
};
