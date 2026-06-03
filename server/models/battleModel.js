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
      deck.push({ ...card, uid: uid++, currentAttack: card.attack, currentDefense: card.defense, canAttack: false, frozen: false });
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
    equipment: null,
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
    log: [],
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

function addBattleLog(battle, message) {
  battle.log.push({ turn: battle.turnNumber, message, time: Date.now() });
}

function findCardByUid(hand, uid) {
  return hand.find(c => c.uid === uid);
}

function findMinionByUid(field, uid) {
  return field.find(c => c.uid === uid);
}

function removeCardFromHand(hand, uid) {
  const idx = hand.findIndex(c => c.uid === uid);
  if (idx !== -1) return hand.splice(idx, 1)[0];
  return null;
}

function removeMinionFromField(field, uid) {
  const idx = field.findIndex(c => c.uid === uid);
  if (idx !== -1) return field.splice(idx, 1)[0];
  return null;
}

function checkBattleEnd(battle) {
  if (battle.player1.hp <= 0) {
    battle.status = 'finished';
    battle.winnerId = battle.player2.playerId;
    finishBattle(battle);
    return true;
  }
  if (battle.player2.hp <= 0) {
    battle.status = 'finished';
    battle.winnerId = battle.player1.playerId;
    finishBattle(battle);
    return true;
  }
  return false;
}

function startTurn(battle) {
  const current = getSelf(battle, battle.currentTurn);
  
  current.maxMana = Math.min(current.maxMana + 1, config.MAX_MANA);
  current.mana = current.maxMana;

  for (const minion of current.field) {
    minion.frozen = false;
    minion.canAttack = !minion.justPlayed;
    if (minion.justPlayed) delete minion.justPlayed;
  }

  const drawCount = Math.min(config.TURN_DRAW, current.deck.length);
  for (let i = 0; i < drawCount; i++) {
    if (current.hand.length < config.MAX_HAND_SIZE && current.deck.length > 0) {
      current.hand.push(current.deck.shift());
    }
  }

  if (current.deck.length === 0 && current.hand.length < config.MAX_HAND_SIZE) {
    current.hp -= 1;
    addBattleLog(battle, '牌库耗尽，受到1点疲劳伤害');
  }

  checkBattleEnd(battle);
}

function dealDamageToMinion(battle, minion, damage, source) {
  minion.currentDefense -= damage;
  addBattleLog(battle, `${source} 对 ${minion.name} 造成 ${damage} 点伤害`);
  
  if (minion.currentDefense <= 0) {
    const owner = getSelf(battle, minion.ownerId) || getOpponent(battle, minion.ownerId);
    const idx = owner.field.findIndex(m => m.uid === minion.uid);
    if (idx !== -1) {
      const dead = owner.field.splice(idx, 1)[0];
      owner.graveyard.push(dead);
      addBattleLog(battle, `${dead.name} 被消灭`);
    }
  }
}

function dealDamageToHero(battle, playerId, damage, source) {
  const player = getSelf(battle, playerId);
  player.hp -= damage;
  addBattleLog(battle, `${source} 对英雄造成 ${damage} 点伤害`);
  checkBattleEnd(battle);
}

function healHero(battle, playerId, amount) {
  const player = getSelf(battle, playerId);
  const actual = Math.min(amount, config.INITIAL_HP - player.hp);
  player.hp += actual;
  addBattleLog(battle, `恢复 ${actual} 点生命`);
}

function buffMinion(minion, stat, value) {
  if (stat === 'attack') {
    minion.currentAttack += value;
  } else if (stat === 'defense') {
    minion.currentDefense += value;
  }
}

function drawCards(battle, playerId, count) {
  const player = getSelf(battle, playerId);
  for (let i = 0; i < count; i++) {
    if (player.hand.length < config.MAX_HAND_SIZE && player.deck.length > 0) {
      player.hand.push(player.deck.shift());
    }
  }
  addBattleLog(battle, `抽了 ${count} 张牌`);
}

function validateTarget(battle, playerId, card, targetUid) {
  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);
  const targetType = card.target_type || 'none';

  switch (targetType) {
    case 'none':
    case 'self_hero':
    case 'all_enemies':
    case 'all_enemy_minions': {
      if (targetUid) {
        return { error: `${card.name} 不需要选择目标` };
      }
      return { valid: true };
    }

    case 'any_enemy': {
      if (!targetUid) {
        return { error: `${card.name} 需要选择一个敌方目标` };
      }
      if (targetUid === 'hero' || targetUid === opponent.playerId) {
        return { valid: true, resolvedTarget: { type: 'hero', playerId: opponent.playerId } };
      }
      const target = findMinionByUid(opponent.field, targetUid);
      if (target) {
        return { valid: true, resolvedTarget: { type: 'minion', uid: targetUid, minion: target } };
      }
      return { error: `${card.name} 只能选择敌方目标` };
    }

    case 'enemy_hero': {
      if (!targetUid || (targetUid !== 'hero' && targetUid !== opponent.playerId)) {
        return { error: `${card.name} 只能对敌方英雄使用` };
      }
      return { valid: true, resolvedTarget: { type: 'hero', playerId: opponent.playerId } };
    }

    case 'enemy_minion': {
      if (!targetUid || targetUid === 'hero' || targetUid === opponent.playerId) {
        return { error: `${card.name} 只能对敌方随从使用，不能对英雄使用` };
      }
      const target = findMinionByUid(opponent.field, targetUid);
      if (!target) {
        return { error: `${card.name} 只能对敌方随从使用` };
      }
      return { valid: true, resolvedTarget: { type: 'minion', uid: targetUid, minion: target } };
    }

    case 'friendly_minion': {
      if (!targetUid || targetUid === 'hero' || targetUid === playerId) {
        return { error: `${card.name} 只能对友方随从使用，不能对英雄使用` };
      }
      const target = findMinionByUid(self.field, targetUid);
      if (!target) {
        return { error: `${card.name} 只能对友方随从使用` };
      }
      return { valid: true, resolvedTarget: { type: 'minion', uid: targetUid, minion: target } };
    }

    default:
      return { error: '未知的目标类型' };
  }
}

function executeSpellEffect(battle, playerId, card, targetUid, resolvedTarget) {
  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);
  const effect = card.skill_name;
  const targetType = card.target_type || 'none';

  switch (effect) {
    case 'direct_damage': {
      const damageMap = {
        '火球术': 4,
        '斩击': 2,
        '暗影突袭': 3,
        '暗影匕首': 1,
      };
      const damage = damageMap[card.name] || 2;
      
      if (resolvedTarget) {
        if (resolvedTarget.type === 'hero') {
          dealDamageToHero(battle, resolvedTarget.playerId, damage, card.name);
        } else if (resolvedTarget.type === 'minion') {
          dealDamageToMinion(battle, resolvedTarget.minion, damage, card.name);
        }
      } else if (targetType === 'enemy_hero') {
        dealDamageToHero(battle, opponent.playerId, damage, card.name);
      }
      break;
    }

    case 'aoe_damage': {
      const damageMap = {
        '雷霆一击': 3,
        '火焰风暴': 3,
        '火焰元素': 1,
        '龙族后裔': 2,
      };
      const damage = damageMap[card.name] || 1;
      
      for (let i = opponent.field.length - 1; i >= 0; i--) {
        dealDamageToMinion(battle, opponent.field[i], damage, card.name);
      }
      
      if (targetType === 'all_enemies') {
        dealDamageToHero(battle, opponent.playerId, damage, card.name);
      }
      break;
    }

    case 'heal': {
      const healMap = {
        '治愈术': 4,
        '护盾术': 5,
        '圣骑士': 3,
      };
      const amount = healMap[card.name] || 3;
      healHero(battle, playerId, amount);

      if (card.name === '护盾术' && resolvedTarget && resolvedTarget.type === 'minion') {
        buffMinion(resolvedTarget.minion, 'defense', 2);
      }
      break;
    }

    case 'buff_attack': {
      const buffMap = {
        '力量祝福': 3,
        '狂战之斧': 3,
        '狂战士': 2,
      };
      const value = buffMap[card.name] || 2;
      
      if (resolvedTarget && resolvedTarget.type === 'minion') {
        buffMinion(resolvedTarget.minion, 'attack', value);
      } else if (card.type === 'creature' && self.field.length > 1) {
        const others = self.field.filter(m => m.uid !== card.uid);
        if (others.length > 0) buffMinion(others[others.length - 1], 'attack', value);
      }
      break;
    }

    case 'buff_defense': {
      const buffMap = {
        '铁壁': 4,
        '守护铠甲': 5,
        '森林守卫': 2,
      };
      const value = buffMap[card.name] || 2;
      
      if (resolvedTarget && resolvedTarget.type === 'minion') {
        buffMinion(resolvedTarget.minion, 'defense', value);
      } else if (card.type === 'creature' && self.field.length > 1) {
        const others = self.field.filter(m => m.uid !== card.uid);
        if (others.length > 0) buffMinion(others[others.length - 1], 'defense', value);
      }
      break;
    }

    case 'draw_card': {
      drawCards(battle, playerId, 2);
      break;
    }

    case 'freeze': {
      if (resolvedTarget && resolvedTarget.type === 'minion') {
        const target = resolvedTarget.minion;
        target.frozen = true;
        target.canAttack = false;
        addBattleLog(battle, `${target.name} 被冻结`);
      }
      break;
    }
  }
}

function playCardValidate(battle, playerId, cardUid, targetUid) {
  const self = getSelf(battle, playerId);
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };
  if (battle.status !== 'ongoing') return { error: '战斗已结束' };
  
  const cardIndex = self.hand.findIndex(c => c.uid === cardUid);
  if (cardIndex === -1) return { error: '手牌中不存在该卡' };
  const card = self.hand[cardIndex];
  if (card.cost > self.mana) return { error: '法力值不足' };
  if ((card.type === 'creature' || card.type === 'equipment') && self.field.length >= config.MAX_FIELD_SIZE) {
    return { error: '场上随从已满' };
  }

  const targetValidation = validateTarget(battle, playerId, card, targetUid);
  if (targetValidation.error) {
    return { error: targetValidation.error };
  }

  return { cardIndex, card, resolvedTarget: targetValidation.resolvedTarget };
}

function playCard(battle, playerId, cardUid, targetUid) {
  const validation = playCardValidate(battle, playerId, cardUid, targetUid);
  if (validation.error) return validation;

  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);
  const { cardIndex, card, resolvedTarget } = validation;

  self.mana -= card.cost;
  self.hand.splice(cardIndex, 1);

  addBattleLog(battle, `打出 ${card.name}`);

  if (card.type === 'creature') {
    const creature = { ...card, ownerId: playerId, canAttack: false, justPlayed: true, frozen: false };
    self.field.push(creature);
    
    if (card.skill_name && card.skill_name !== '') {
      executeSpellEffect(battle, playerId, card, targetUid, resolvedTarget);
    }
  } else if (card.type === 'equipment') {
    if (self.equipment) {
      self.graveyard.push(self.equipment);
    }
    self.equipment = card;
    
    if (card.skill_name === 'buff_attack' && card.target_type !== 'friendly_minion') {
      for (const m of self.field) m.currentAttack += 1;
    } else if (card.skill_name === 'buff_defense' && card.target_type !== 'friendly_minion') {
      for (const m of self.field) m.currentDefense += 1;
    }
    
    if (card.skill_name && card.skill_name !== 'buff_attack' && card.skill_name !== 'buff_defense') {
      executeSpellEffect(battle, playerId, card, targetUid, resolvedTarget);
    } else if (card.target_type === 'friendly_minion') {
      executeSpellEffect(battle, playerId, card, targetUid, resolvedTarget);
    }
  } else if (card.type === 'spell') {
    executeSpellEffect(battle, playerId, card, targetUid, resolvedTarget);
    self.graveyard.push(card);
  }

  return { played: card };
}

function attackValidate(battle, playerId, attackerUid, targetUid) {
  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);
  
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };
  if (battle.status !== 'ongoing') return { error: '战斗已结束' };

  const attacker = self.field.find(c => c.uid === attackerUid);
  if (!attacker) return { error: '未找到攻击者' };
  if (!attacker.canAttack) return { error: '该随从无法攻击' };
  if (attacker.frozen) return { error: '该随从被冻结' };

  const tauntMinions = opponent.field.filter(m => m.taunt);
  
  if (targetUid === 'hero' || targetUid === opponent.playerId) {
    if (tauntMinions.length > 0) {
      return { error: '必须先攻击有嘲讽的随从' };
    }
    return { attacker, targetType: 'hero' };
  }

  const target = opponent.field.find(c => c.uid === targetUid);
  if (!target) return { error: '未找到目标' };
  
  return { attacker, targetType: 'minion', target };
}

function executeAttack(battle, playerId, attackerUid, targetUid) {
  const validation = attackValidate(battle, playerId, attackerUid, targetUid);
  if (validation.error) return validation;

  const { attacker, targetType, target } = validation;
  const self = getSelf(battle, playerId);
  const opponent = getOpponent(battle, playerId);

  attacker.canAttack = false;

  if (targetType === 'hero') {
    let damage = attacker.currentAttack;
    if (opponent.equipment && opponent.equipment.skill_name === 'reflect') {
      attacker.currentDefense -= 1;
      addBattleLog(battle, '反弹 1 点伤害');
    }
    dealDamageToHero(battle, opponent.playerId, damage, attacker.name);
  } else {
    addBattleLog(battle, `${attacker.name} 攻击 ${target.name}`);
    
    const attackerDmg = attacker.currentAttack;
    const targetDmg = target.currentAttack;
    
    target.currentDefense -= attackerDmg;
    attacker.currentDefense -= targetDmg;

    if (target.currentDefense <= 0) {
      const idx = opponent.field.findIndex(m => m.uid === target.uid);
      if (idx !== -1) {
        const dead = opponent.field.splice(idx, 1)[0];
        opponent.graveyard.push(dead);
        addBattleLog(battle, `${dead.name} 被消灭`);
      }
    }
    
    if (attacker.currentDefense <= 0) {
      const idx = self.field.findIndex(m => m.uid === attacker.uid);
      if (idx !== -1) {
        const dead = self.field.splice(idx, 1)[0];
        self.graveyard.push(dead);
        addBattleLog(battle, `${dead.name} 被消灭`);
      }
    }
  }

  checkBattleEnd(battle);
  return { attackerUid, targetUid, success: true };
}

function endTurn(battle, playerId) {
  if (battle.currentTurn !== playerId) return { error: '不是你的回合' };
  if (battle.status !== 'ongoing') return { error: '战斗已结束' };

  addBattleLog(battle, '回合结束');

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
    addBattleLog(battle, `胜者获得 ${config.GOLD_PER_WIN} 金币`);
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
    log: battle.log.slice(-10),
    self: {
      playerId: self.playerId,
      hp: self.hp,
      mana: self.mana,
      maxMana: self.maxMana,
      hand: self.hand,
      field: self.field,
      deckCount: self.deck.length,
      equipment: self.equipment,
    },
    opponent: {
      playerId: opponent.playerId,
      hp: opponent.hp,
      mana: opponent.mana,
      maxMana: opponent.maxMana,
      handCount: opponent.hand.length,
      field: opponent.field,
      deckCount: opponent.deck.length,
      equipment: opponent.equipment,
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
  finishBattle,
  validateTarget,
};
