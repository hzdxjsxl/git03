const cardModel = require('../models/cardModel');
const playerModel = require('../models/playerModel');
const cardView = require('../views/cardView');

function getAllCards(req, res) {
  const cards = cardModel.getAllCards();
  res.json({ cards: cards.map(cardView.formatCard) });
}

function getPlayerCollection(req, res) {
  const collection = cardModel.getPlayerCollection(req.player.id);
  res.json({ collection: cardView.formatCardCollection(collection) });
}

function openPack(req, res) {
  const result = cardModel.openPack(req.player.id);
  if (!result) {
    return res.status(400).json({ error: '金币不足，无法开包' });
  }
  const gold = playerModel.getGold(req.player.id);
  res.json({ ...cardView.formatPackResult(result), gold });
}

module.exports = {
  getAllCards,
  getPlayerCollection,
  openPack,
};
