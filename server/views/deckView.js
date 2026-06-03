const cardView = require('./cardView');

function formatDeck(deck) {
  return {
    id: deck.id,
    name: deck.name,
    createdAt: deck.created_at,
    cards: (deck.cards || []).map(c => ({
      ...cardView.formatCard(c),
      quantity: c.quantity,
    })),
  };
}

function formatDeckList(decks) {
  return decks.map(d => ({
    id: d.id,
    name: d.name,
    createdAt: d.created_at,
  }));
}

module.exports = {
  formatDeck,
  formatDeckList,
};
