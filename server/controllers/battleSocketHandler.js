const battleModel = require('../models/battleModel');
const playerModel = require('../models/playerModel');

const waitingQueue = [];
const playerSockets = new Map();

function registerBattleHandlers(io, socket) {
  const playerId = socket.handshake.auth.playerId;
  const token = socket.handshake.auth.token;

  if (!playerId || !token) {
    socket.disconnect(true);
    return;
  }

  const player = playerModel.findByToken(token);
  if (!player || player.id !== playerId) {
    socket.disconnect(true);
    return;
  }

  playerSockets.set(playerId, { socket, player });
  console.log(`[Socket] Player ${player.username} connected`);

  socket.on('battle:matchmake', (data) => {
    const { deckId } = data;
    const existing = waitingQueue.find(e => e.playerId === playerId);
    if (existing) return;

    waitingQueue.push({ playerId, deckId, socket, username: player.username });
    console.log(`[Match] ${player.username} waiting, queue: ${waitingQueue.length}`);

    if (waitingQueue.length >= 2) {
      const p1 = waitingQueue.shift();
      const p2 = waitingQueue.shift();
      const battle = battleModel.createBattle(p1.playerId, p1.deckId, p2.playerId, p2.deckId);
      battleModel.startTurn(battle);

      const p1State = battleModel.sanitizeForPlayer(battle, p1.playerId);
      const p2State = battleModel.sanitizeForPlayer(battle, p2.playerId);

      p1.socket.emit('battle:start', { battle: p1State });
      p2.socket.emit('battle:start', { battle: p2State });
      console.log(`[Battle] ${p1.username} vs ${p2.username}, id: ${battle.id}`);
    }
  });

  socket.on('battle:cancelMatch', () => {
    const idx = waitingQueue.findIndex(e => e.playerId === playerId);
    if (idx !== -1) waitingQueue.splice(idx, 1);
    console.log(`[Match] ${player.username} cancelled, queue: ${waitingQueue.length}`);
  });

  socket.on('battle:playCard', (data) => {
    const { battleId, cardUid } = data;
    const battle = battleModel.getBattle(battleId);
    if (!battle) return socket.emit('battle:error', { message: '战斗不存在' });

    const result = battleModel.playCard(battle, playerId, cardUid);
    if (result.error) return socket.emit('battle:error', { message: result.error });

    broadcastBattleState(io, battle);
  });

  socket.on('battle:attack', (data) => {
    const { battleId, attackerUid, targetUid } = data;
    const battle = battleModel.getBattle(battleId);
    if (!battle) return socket.emit('battle:error', { message: '战斗不存在' });

    const result = battleModel.executeAttack(battle, playerId, attackerUid, targetUid);
    if (result.error) return socket.emit('battle:error', { message: result.error });

    broadcastBattleState(io, battle);
  });

  socket.on('battle:endTurn', (data) => {
    const { battleId } = data;
    const battle = battleModel.getBattle(battleId);
    if (!battle) return socket.emit('battle:error', { message: '战斗不存在' });

    const result = battleModel.endTurn(battle, playerId);
    if (result.error) return socket.emit('battle:error', { message: result.error });

    broadcastBattleState(io, battle);
  });

  socket.on('battle:concede', (data) => {
    const { battleId } = data;
    const battle = battleModel.getBattle(battleId);
    if (!battle || battle.status !== 'ongoing') return;

    const opponent = battleModel.getOpponent(battle, playerId);
    battle.status = 'finished';
    battle.winnerId = opponent.playerId;
    battleModel.finishBattle(battle);
    broadcastBattleState(io, battle);
  });

  socket.on('disconnect', () => {
    playerSockets.delete(playerId);
    const idx = waitingQueue.findIndex(e => e.playerId === playerId);
    if (idx !== -1) waitingQueue.splice(idx, 1);
    console.log(`[Socket] Player ${player.username} disconnected`);
  });
}

function broadcastBattleState(io, battle) {
  const p1State = battleModel.sanitizeForPlayer(battle, battle.player1.playerId);
  const p2State = battleModel.sanitizeForPlayer(battle, battle.player2.playerId);

  const p1Conn = playerSockets.get(battle.player1.playerId);
  const p2Conn = playerSockets.get(battle.player2.playerId);

  if (p1Conn) p1Conn.socket.emit('battle:state', { battle: p1State });
  if (p2Conn) p2Conn.socket.emit('battle:state', { battle: p2State });
}

module.exports = { registerBattleHandlers };
