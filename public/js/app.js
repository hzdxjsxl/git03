const App = {
  token: null,
  playerId: null,
  username: null,
  selectedDeckId: null,
  isMatching: false,

  init() {
    this.bindEvents();
    const saved = sessionStorage.getItem('game_auth');
    if (saved) {
      try {
        const auth = JSON.parse(saved);
        this.token = auth.token;
        this.playerId = auth.id;
        this.username = auth.username;
        this.enterLobby();
      } catch (e) {
        sessionStorage.removeItem('game_auth');
      }
    }
  },

  bindEvents() {
    document.getElementById('btn-login').addEventListener('click', () => this.login());
    document.getElementById('login-username').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login();
    });

    document.querySelectorAll('.btn-nav').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    document.getElementById('btn-open-pack').addEventListener('click', () => this.openPack());
    document.getElementById('btn-create-deck').addEventListener('click', () => this.createDeck());
    document.getElementById('btn-save-deck').addEventListener('click', () => this.saveDeck());
    document.getElementById('btn-matchmake').addEventListener('click', () => this.toggleMatchmake());
    document.getElementById('btn-end-turn').addEventListener('click', () => BattleClient.endTurn());
  },

  async login() {
    const username = document.getElementById('login-username').value.trim();
    if (!username) {
      this.notify('请输入用户名', 'error');
      return;
    }

    try {
      let res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      let data = await res.json();

      if (data.error) {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username }),
        });
        data = await res.json();
      }

      if (data.error) {
        this.notify(data.error, 'error');
        return;
      }

      this.token = data.player.token;
      this.playerId = data.player.id;
      this.username = data.player.username;

      sessionStorage.setItem('game_auth', JSON.stringify(data.player));
      this.enterLobby();
    } catch (err) {
      this.notify('连接失败: ' + err.message, 'error');
    }
  },

  async enterLobby() {
    SocketClient.connect(this.playerId, this.token);
    BattleClient.init();

    document.getElementById('lobby-username').textContent = this.username;
    this.showPage('page-lobby');
    await this.refreshLobby();
  },

  async refreshLobby() {
    await CardManager.fetchAllCards();
    await CardManager.fetchCollection();
    await CardManager.fetchDecks();
    await this.fetchPlayerInfo();
    this.renderCollection();
    this.renderDeckList();
    this.renderBattleDeckSelect();
  },

  async fetchPlayerInfo() {
    const res = await fetch('/api/player/info', {
      headers: { 'Authorization': this.token },
    });
    const data = await res.json();
    if (data.player) {
      this.updateGold(data.player.gold);
    }
  },

  updateGold(gold) {
    document.getElementById('lobby-gold').textContent = `💰 ${gold}`;
  },

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
  },

  switchTab(tabId) {
    document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
    document.querySelector(`.btn-nav[data-tab="${tabId}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
  },

  renderCollection() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    for (const card of CardManager.collection) {
      const el = CardManager.renderCard(card, { showOwned: true });
      grid.appendChild(el);
    }
    if (CardManager.collection.length === 0) {
      grid.innerHTML = '<p style="color:#888;grid-column:1/-1;text-align:center;padding:40px;">还没有卡牌，去商店开包吧！</p>';
    }
  },

  renderDeckList() {
    const list = document.getElementById('deck-list');
    list.innerHTML = '';
    for (const deck of CardManager.decks) {
      const item = document.createElement('div');
      item.className = 'deck-item';
      item.innerHTML = `
        <span>${deck.name}</span>
        <div>
          <button class="btn btn-sm btn-primary btn-edit-deck" data-id="${deck.id}">编辑</button>
          <button class="btn btn-sm btn-danger btn-delete-deck" data-id="${deck.id}">删除</button>
        </div>
      `;
      item.querySelector('.btn-edit-deck').addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.editDeck(deck.id);
      });
      item.querySelector('.btn-delete-deck').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm('确认删除卡组？')) {
          await CardManager.deleteDeck(deck.id);
          this.renderDeckList();
          this.renderBattleDeckSelect();
        }
      });
      list.appendChild(item);
    }
  },

  async editDeck(deckId) {
    const res = await fetch(`/api/decks/${deckId}`, {
      headers: { 'Authorization': this.token },
    });
    const data = await res.json();
    if (data.error) {
      this.notify(data.error, 'error');
      return;
    }
    CardManager.startDeckEditor(data.deck);
    document.getElementById('deck-editor').classList.remove('hidden');
    document.getElementById('deck-editor-title').textContent = `编辑: ${data.deck.name}`;
  },

  createDeck() {
    CardManager.startDeckEditor(null);
    document.getElementById('deck-editor').classList.remove('hidden');
    document.getElementById('deck-editor-title').textContent = '新建卡组';
  },

  async saveDeck() {
    const name = document.getElementById('deck-name-input').value.trim();
    if (!name) {
      this.notify('请输入卡组名称', 'error');
      return;
    }
    const total = CardManager.editingDeckCards.reduce((s, c) => s + c.quantity, 0);
    if (total !== 20) {
      this.notify(`卡组需要恰好20张，当前${total}张`, 'error');
      return;
    }
    const cards = CardManager.editingDeckCards.map(c => ({ cardId: c.cardId, quantity: c.quantity }));
    const result = await CardManager.createDeck(name, cards);
    if (result) {
      this.notify('卡组保存成功！', 'success');
      document.getElementById('deck-editor').classList.add('hidden');
      document.getElementById('deck-name-input').value = '';
      this.renderDeckList();
      this.renderBattleDeckSelect();
    }
  },

  async openPack() {
    const result = await CardManager.openPack();
    if (!result) return;
    const container = document.getElementById('pack-cards');
    container.innerHTML = '';
    for (const card of result.cards) {
      const el = CardManager.renderCard(card);
      container.appendChild(el);
    }
    document.getElementById('pack-result').classList.remove('hidden');
    this.renderCollection();
  },

  renderBattleDeckSelect() {
    const list = document.getElementById('battle-deck-select');
    list.innerHTML = '';
    for (const deck of CardManager.decks) {
      const item = document.createElement('div');
      item.className = 'deck-item';
      if (deck.id === this.selectedDeckId) item.classList.add('selected');
      item.innerHTML = `<span>${deck.name}</span>`;
      item.addEventListener('click', () => {
        this.selectedDeckId = deck.id;
        list.querySelectorAll('.deck-item').forEach(d => d.classList.remove('selected'));
        item.classList.add('selected');
        document.getElementById('btn-matchmake').disabled = false;
      });
      list.appendChild(item);
    }
    if (CardManager.decks.length === 0) {
      list.innerHTML = '<p style="color:#888;padding:20px;">还没有卡组，请先在"卡组编排"中创建</p>';
    }
  },

  toggleMatchmake() {
    if (this.isMatching) {
      SocketClient.cancelMatch();
      this.isMatching = false;
      document.getElementById('btn-matchmake').textContent = '匹配对手';
      document.getElementById('match-status').textContent = '';
      return;
    }
    if (!this.selectedDeckId) {
      this.notify('请先选择卡组', 'error');
      return;
    }
    SocketClient.matchmake(this.selectedDeckId);
    this.isMatching = true;
    document.getElementById('btn-matchmake').textContent = '取消匹配';
    document.getElementById('match-status').textContent = '正在匹配对手...';
  },

  notify(message, type) {
    const el = document.createElement('div');
    el.className = `notification ${type || 'info'}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
