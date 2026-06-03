const { getDb } = require('./database');
const config = require('../config');

const CARD_RARITY_WEIGHTS = {
  common: 60,
  rare: 25,
  epic: 10,
  legendary: 5,
};

function getAllCards() {
  const { query } = getDb();
  return query('SELECT * FROM cards ORDER BY cost ASC, name ASC');
}

function getCardById(id) {
  const { queryOne } = getDb();
  return queryOne('SELECT * FROM cards WHERE id = ?', [id]);
}

function getPlayerCollection(playerId) {
  const { query } = getDb();
  return query(
    `SELECT c.*, pc.count FROM cards c
     JOIN player_cards pc ON c.id = pc.card_id
     WHERE pc.player_id = ? AND pc.count > 0
     ORDER BY c.cost ASC, c.name ASC`,
    [playerId]
  );
}

function addCardToPlayer(playerId, cardId, count) {
  const { run, saveToFile } = getDb();
  count = count || 1;
  const existing = getDb().queryOne('SELECT count FROM player_cards WHERE player_id = ? AND card_id = ?', [playerId, cardId]);
  if (existing) {
    run('UPDATE player_cards SET count = count + ? WHERE player_id = ? AND card_id = ?', [count, playerId, cardId]);
  } else {
    run('INSERT INTO player_cards (player_id, card_id, count) VALUES (?, ?, ?)', [playerId, cardId, count]);
  }
  saveToFile();
}

function removeCardFromPlayer(playerId, cardId, count) {
  const { run, queryOne, saveToFile } = getDb();
  count = count || 1;
  const row = queryOne('SELECT count FROM player_cards WHERE player_id = ? AND card_id = ?', [playerId, cardId]);
  if (!row || row.count < count) return false;
  if (row.count <= count) {
    run('DELETE FROM player_cards WHERE player_id = ? AND card_id = ?', [playerId, cardId]);
  } else {
    run('UPDATE player_cards SET count = count - ? WHERE player_id = ? AND card_id = ?', [count, playerId, cardId]);
  }
  saveToFile();
  return true;
}

function openPack(playerId) {
  const { run, queryOne, saveToFile } = getDb();
  const player = queryOne('SELECT gold FROM players WHERE id = ?', [playerId]);
  if (!player || player.gold < config.PACK_COST) return null;

  run('UPDATE players SET gold = gold - ? WHERE id = ?', [config.PACK_COST, playerId]);

  const cards = [];
  const allCards = getAllCards();
  const pool = [];
  for (const card of allCards) {
    const weight = CARD_RARITY_WEIGHTS[card.rarity] || 1;
    for (let i = 0; i < weight; i++) pool.push(card);
  }

  const picked = new Set();
  while (cards.length < config.PACK_SIZE) {
    const idx = Math.floor(Math.random() * pool.length);
    const card = pool[idx];
    if (!picked.has(card.id) || pool.length <= config.PACK_SIZE) {
      picked.add(card.id);
      addCardToPlayer(playerId, card.id, 1);
      cards.push(card);
    }
  }
  saveToFile();
  return cards;
}

module.exports = {
  getAllCards,
  getCardById,
  getPlayerCollection,
  addCardToPlayer,
  removeCardFromPlayer,
  openPack,
};
