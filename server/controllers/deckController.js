const deckModel = require('../models/deckModel');
const deckView = require('../views/deckView');

function getDecks(req, res) {
  const decks = deckModel.getPlayerDecks(req.player.id);
  res.json({ decks: deckView.formatDeckList(decks) });
}

function getDeck(req, res) {
  const deck = deckModel.getDeckById(req.params.deckId);
  if (!deck || deck.player_id !== req.player.id) {
    return res.status(404).json({ error: '卡组不存在' });
  }
  res.json({ deck: deckView.formatDeck(deck) });
}

function createDeck(req, res) {
  const { name, cards } = req.body;
  if (!name || !cards || !Array.isArray(cards)) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const cardEntries = cards.map(c => ({ cardId: c.cardId, quantity: c.quantity }));
  const result = deckModel.createDeck(req.player.id, name, cardEntries);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ deck: result });
}

function deleteDeck(req, res) {
  const success = deckModel.deleteDeck(req.params.deckId, req.player.id);
  if (!success) {
    return res.status(404).json({ error: '卡组不存在或无权删除' });
  }
  res.json({ success: true });
}

module.exports = {
  getDecks,
  getDeck,
  createDeck,
  deleteDeck,
};
