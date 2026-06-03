const { getDb } = require('./database');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const cardModel = require('./cardModel');

function getPlayerDecks(playerId) {
  const { query } = getDb();
  return query('SELECT * FROM decks WHERE player_id = ? ORDER BY created_at DESC', [playerId]);
}

function getDeckById(deckId) {
  const { queryOne, query } = getDb();
  const deck = queryOne('SELECT * FROM decks WHERE id = ?', [deckId]);
  if (!deck) return null;
  const cards = query(
    `SELECT c.*, dc.quantity FROM cards c
     JOIN deck_cards dc ON c.id = dc.card_id
     WHERE dc.deck_id = ?`,
    [deckId]
  );
  return { ...deck, cards };
}

function createDeck(playerId, name, cardEntries) {
  const { run, saveToFile } = getDb();
  const totalCards = cardEntries.reduce((sum, e) => sum + e.quantity, 0);
  if (totalCards !== config.DECK_SIZE) {
    return { error: `卡组必须恰好${config.DECK_SIZE}张卡，当前${totalCards}张` };
  }

  const collection = cardModel.getPlayerCollection(playerId);
  const collectionMap = {};
  for (const c of collection) collectionMap[c.id] = c.count;

  for (const entry of cardEntries) {
    const owned = collectionMap[entry.cardId] || 0;
    if (entry.quantity > owned) {
      return { error: `卡牌ID ${entry.cardId} 拥有${owned}张，不足${entry.quantity}张` };
    }
  }

  const deckId = uuidv4();
  run('INSERT INTO decks (id, player_id, name) VALUES (?, ?, ?)', [deckId, playerId, name]);
  for (const entry of cardEntries) {
    run('INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, ?)', [deckId, entry.cardId, entry.quantity]);
  }
  saveToFile();
  return { id: deckId, name };
}

function deleteDeck(deckId, playerId) {
  const { run, runWithInfo, saveToFile } = getDb();
  run('DELETE FROM deck_cards WHERE deck_id = ?', [deckId]);
  const result = runWithInfo('DELETE FROM decks WHERE id = ? AND player_id = ?', [deckId, playerId]);
  saveToFile();
  return result.changes > 0;
}

function getDeckCardIds(deckId) {
  const { query } = getDb();
  return query('SELECT card_id, quantity FROM deck_cards WHERE deck_id = ?', [deckId]);
}

module.exports = {
  getPlayerDecks,
  getDeckById,
  createDeck,
  deleteDeck,
  getDeckCardIds,
};
