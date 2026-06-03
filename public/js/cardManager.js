const CardManager = {
  allCards: [],
  collection: [],
  decks: [],
  editingDeck: null,
  editingDeckCards: [],

  async fetchAllCards() {
    const res = await fetch('/api/cards');
    const data = await res.json();
    this.allCards = data.cards;
    return this.allCards;
  },

  async fetchCollection() {
    const res = await fetch('/api/cards/collection', {
      headers: { 'Authorization': App.token },
    });
    const data = await res.json();
    this.collection = data.collection;
    return this.collection;
  },

  async openPack() {
    const res = await fetch('/api/cards/pack', {
      method: 'POST',
      headers: { 'Authorization': App.token },
    });
    const data = await res.json();
    if (data.error) {
      App.notify(data.error, 'error');
      return null;
    }
    App.updateGold(data.gold);
    await this.fetchCollection();
    return data;
  },

  async fetchDecks() {
    const res = await fetch('/api/decks', {
      headers: { 'Authorization': App.token },
    });
    const data = await res.json();
    this.decks = data.decks;
    return this.decks;
  },

  async createDeck(name, cards) {
    const res = await fetch('/api/decks', {
      method: 'POST',
      headers: {
        'Authorization': App.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, cards }),
    });
    const data = await res.json();
    if (data.error) {
      App.notify(data.error, 'error');
      return null;
    }
    await this.fetchDecks();
    return data.deck;
  },

  async deleteDeck(deckId) {
    const res = await fetch(`/api/decks/${deckId}`, {
      method: 'DELETE',
      headers: { 'Authorization': App.token },
    });
    const data = await res.json();
    if (data.error) {
      App.notify(data.error, 'error');
      return false;
    }
    await this.fetchDecks();
    return true;
  },

  startDeckEditor(deck) {
    this.editingDeck = deck;
    this.editingDeckCards = deck ? deck.cards.map(c => ({ cardId: c.id, quantity: c.quantity, name: c.name, cost: c.cost })) : [];
    this.renderDeckEditor();
  },

  addToDeck(cardId) {
    const maxPerCard = 2;
    const deckSize = 20;
    const existing = this.editingDeckCards.find(c => c.cardId === cardId);
    const total = this.editingDeckCards.reduce((s, c) => s + c.quantity, 0);

    if (total >= deckSize) {
      App.notify('卡组已满20张', 'error');
      return;
    }
    if (existing) {
      if (existing.quantity >= maxPerCard) {
        App.notify('同一卡牌最多2张', 'error');
        return;
      }
      existing.quantity++;
    } else {
      const card = this.collection.find(c => c.id === cardId) || this.allCards.find(c => c.id === cardId);
      if (!card) return;
      this.editingDeckCards.push({ cardId, quantity: 1, name: card.name, cost: card.cost });
    }
    this.renderDeckEditor();
  },

  removeFromDeck(cardId) {
    const idx = this.editingDeckCards.findIndex(c => c.cardId === cardId);
    if (idx === -1) return;
    if (this.editingDeckCards[idx].quantity > 1) {
      this.editingDeckCards[idx].quantity--;
    } else {
      this.editingDeckCards.splice(idx, 1);
    }
    this.renderDeckEditor();
  },

  renderCard(card, options = {}) {
    const { showOwned, showQuantity, onClick, small, inDeck } = options;
    const rarityClass = `rarity-${card.rarity || 'common'}`;
    const typeLabels = { creature: '随从', spell: '法术', equipment: '装备' };

    const div = document.createElement('div');
    div.className = `game-card ${rarityClass}${small ? ' small' : ''}`;
    div.dataset.cardId = card.id;
    div.dataset.cardUid = card.uid || '';

    div.innerHTML = `
      <span class="card-cost">${card.cost}</span>
      <div class="card-name">${card.name}</div>
      <div class="card-type">${typeLabels[card.type] || card.type}</div>
      ${(card.type === 'creature' || card.type === 'equipment') ? `
        <div class="card-stats">
          <span class="atk">⚔${card.currentAttack || card.attack}</span>
          <span class="def">🛡${card.currentDefense || card.defense}</span>
        </div>
      ` : ''}
      ${card.skillName ? `<div class="card-skill">${card.skillDesc || card.skillName}</div>` : ''}
      ${showOwned && card.owned !== undefined ? `<div class="card-owned">拥有: ${card.owned}</div>` : ''}
    `;

    if (onClick) div.addEventListener('click', () => onClick(card));
    return div;
  },

  renderDeckEditor() {
    const container = document.getElementById('deck-cards');
    const availableContainer = document.getElementById('deck-available-cards');
    const countEl = document.getElementById('deck-card-count');

    if (!container) return;

    container.innerHTML = '';
    const total = this.editingDeckCards.reduce((s, c) => s + c.quantity, 0);
    countEl.textContent = `${total}/20`;
    countEl.style.color = total === 20 ? '#2ecc71' : '#f5af19';

    for (const entry of this.editingDeckCards) {
      const chip = document.createElement('div');
      chip.className = 'deck-card-chip';
      chip.innerHTML = `<span class="chip-cost">${entry.cost}</span> ${entry.name} x${entry.quantity}`;
      chip.addEventListener('click', () => this.removeFromDeck(entry.cardId));
      container.appendChild(chip);
    }

    availableContainer.innerHTML = '';
    for (const card of this.collection) {
      const inDeck = this.editingDeckCards.find(c => c.cardId === card.id);
      const availCount = card.owned - (inDeck ? inDeck.quantity : 0);
      const canAdd = availCount > 0;
      const el = this.renderCard({ ...card, owned: availCount }, {
        small: true,
        onClick: canAdd ? (c) => this.addToDeck(c.id) : null,
      });
      if (!canAdd) {
        el.style.opacity = '0.4';
        el.style.cursor = 'not-allowed';
      }
      availableContainer.appendChild(el);
    }
  },
};
