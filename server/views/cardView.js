function formatCard(card) {
  return {
    id: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    attack: card.attack,
    defense: card.defense,
    skillName: card.skill_name,
    skillDesc: card.skill_desc,
    target_type: card.target_type,
    rarity: card.rarity,
  };
}

function formatCardCollection(cards) {
  return cards.map(c => ({
    ...formatCard(c),
    owned: c.count,
  }));
}

function formatPackResult(cards) {
  return {
    count: cards.length,
    cards: cards.map(formatCard),
  };
}

module.exports = {
  formatCard,
  formatCardCollection,
  formatPackResult,
};
