const { getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const cardModel = require('./cardModel');
const deckModel = require('./deckModel');
const playerModel = require('./playerModel');

const activeBattles = new Map();

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildBattleDeck(deckId) {
  const cardEntries = deckModel.getDeckCardIds(deckId);
  const deck = [];
  let uid = 0;
  for (const entry of cardEntries) {
    const card = cardModel.getCardById(entry.card_id);
    if (!card) continue;
    for (let i = 0; i < entry.quantity; i++) {
      deck.push({ ...card, uid: uid++, currentAttack: card.attack, currentDefense: card.defense, canAttack: false });
    }
  }
  return shuffleArray(deck);
}

function createPlayerBattleState(playerId, deckId) {
  const deck = buildBattleDeck(deckId);
  const hand = deck.splice(0, Math.min(config.INITIAL_DRAW, deck.length));
  return {
    playerId,
    hp: config.INITIAL_HP,
    mana: 0,
    maxMana: 0,
    hand,
    field: [],
    deck,
    graveyard: [],
  };
}

function createBattle(player1Id, player1DeckId, player2Id, player2DeckId) {
  const { run, saveToFile } = getDb();
  const id = uuidv4();
  const p1State = createPlayerBattleState(player1Id, player1DeckId);
  const p2State = createPlayerBattleState(player2Id, player2DeckId);

  const battle = {
    id,
    player1: p1State,
    player2: p2State,
    currentTurn: player1Id,
    turnNumber: 1,
    status: 'ongoing',
  };

  activeBattles.set(id, battle);

  run(
    'INSERT INTO battles (id, player1_id, player2_id, status) VALUES (?, ?, ?, ?)',
    [id, player1Id, player2Id, 'ongoing']
  );
  saveToFile();

  return battle;
}

function getBattle(battleId) {
  return activeBattles.get(battleId) || null;
}

function getOpponent(battle, playerId) {
  return battle.player1.playerId === playerId ? battle.player2 : battle.player1;
}

function getSelf(battle, playerId) {
  return battle.player1.playerId === playerId ? battle.player1 : battle.player2;
}

function startTurn(battle) {
  const current = getSelf(battle, battle.currentTurn);
  current.maxMana = Math.min(current.maxMana + 1, config.MAX_MANA);
  current.mana = current.maxMana;
  const drawCount = Math.min(config.TURN_DRAW, current.deck.length);
  for (let i = 0; i < drawCount; i++) {
    if (current.hand.length < config.MAX_HAND_SIZE && current.deck.length > 0) {
      current.hand.push(current.deck.shift());
    }
  }
  for (const creature of current.field) {
    creature.canAttack = true;
  }
}

function playCardValidate(battle, playerId, cardUid) {
  const self = getSelf(battle, playerId);
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };
  const cardIndex = self.hand.findIndex(c => c.uid === cardUid);
  if (cardIndex === -1) return { error: '手牌中不存在该卡' };
  const card = self.hand[cardIndex];
  if (card.cost > self.mana) return { error: '法力值不足' };
  if (card.type === 'creature' && self.field.length >= config.MAX_FIELD_SIZE) {
    return { error: '场上随从已满' };
  }
  return { cardIndex, card };
}

function playCard(battle, playerId, cardUid) {
  const validation = playCardValidate(battle, playerId, cardUid);
  if (validation.error) return validation;

  const self = getSelf(battle, playerId);
  const { cardIndex, card } = validation;

  self.mana -= card.cost;
  self.hand.splice(cardIndex, 1);

  if (card.type === 'creature' || card.type === 'equipment') {
    const creature = { ...card, canAttack: false };
    self.field.push(creature);
  }

  return { played: card };
}

function attackValidate(battle, playerId, attackerUid, targetUid) {
  const self = getSelf(battle, playerId);
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };

  const attacker = self.field.find(c => c.uid === attackerUid);
  if (!attacker) return { error: '未找到攻击者' };
  if (!attacker.canAttack) return { error: '该随从无法攻击' };

  let target = null;
  if (targetUid === 'hero') {
    target = 'hero';
  } else {
    const opponent = getOpponent(battle, playerId);
    target = opponent.field.find(c => c.uid === targetUid);
    if (!target) return { error: '未找到目标' };
  }

  return { attacker, target };
}

function executeAttack(battle, playerId, attackerUid, targetUid) {
  const validation = attackValidate(battle, playerId, attackerUid, targetUid);
  if (validation.error) return validation;

  const { attacker, target } = validation;
  const opponent = getOpponent(battle, playerId);
  const self = getSelf(battle, playerId);

  attacker.canAttack = false;

  if (target === 'hero') {
    opponent.hp -= attacker.currentAttack;
  } else {
    target.currentDefense -= attacker.currentAttack;
    attacker.currentDefense -= target.currentAttack;

    if (target.currentDefense <= 0) {
      const idx = opponent.field.findIndex(c => c.uid === target.uid);
      if (idx !== -1) {
        opponent.graveyard.push(opponent.field.splice(idx, 1)[0]);
      }
    }
    if (attacker.currentDefense <= 0) {
      const idx = self.field.findIndex(c => c.uid === attacker.uid);
      if (idx !== -1) {
        self.graveyard.push(self.field.splice(idx, 1)[0]);
      }
    }
  }

  if (opponent.hp <= 0) {
    battle.status = 'finished';
    battle.winnerId = playerId;
    finishBattle(battle);
  }

  return { attackerUid, targetUid, success: true };
}

function endTurn(battle, playerId) {
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };
  if (battle.status !== 'ongoing') return { error: '战斗已结束' };

  battle.currentTurn = getOpponent(battle, playerId).playerId;
  battle.turnNumber += 1;
  startTurn(battle);
  return { success: true };
}

function finishBattle(battle) {
  const { run, saveToFile } = getDb();
  run(
    'UPDATE battles SET winner_id = ?, status = ? WHERE id = ?',
    [battle.winnerId, 'finished', battle.id]
  );

  if (battle.winnerId) {
    playerModel.updateGold(battle.winnerId, config.GOLD_PER_WIN);
  }
  const loserId = battle.winnerId === battle.player1.playerId ? battle.player2.playerId : battle.player1.playerId;
  playerModel.updateGold(loserId, Math.floor(config.GOLD_PER_WIN / 3));

  saveToFile();

  setTimeout(() => {
    activeBattles.delete(battle.id);
  }, 30000);
}

function sanitizeForPlayer(battle, playerId) {
  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);
  return {
    battleId: battle.id,
    turnNumber: battle.turnNumber,
    currentTurn: battle.currentTurn,
    status: battle.status,
    winnerId: battle.winnerId,
    self: {
      playerId: self.playerId,
      hp: self.hp,
      mana: self.mana,
      maxMana: self.maxMana,
      hand: self.hand,
      field: self.field,
      deckCount: self.deck.length,
    },
    opponent: {
      playerId: opponent.playerId,
      hp: opponent.hp,
      mana: opponent.mana,
      maxMana: opponent.maxMana,
      handCount: opponent.hand.length,
      field: opponent.field,
      deckCount: opponent.deck.length,
    },
  };
}

module.exports = {
  createBattle,
  getBattle,
  getOpponent,
  getSelf,
  startTurn,
  playCard,
  executeAttack,
  endTurn,
  sanitizeForPlayer,
  activeBattles,
};
