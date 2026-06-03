const BattleClient = {
  battleId: null,
  battleState: null,
  selectedCard: null,
  phase: 'idle',

  init() {
    SocketClient.onBattleStart((data) => {
      this.battleState = data.battle;
      this.battleId = data.battle.battleId;
      this.phase = 'playing';
      App.showPage('page-battle');
      this.render();
      App.notify('对战开始！', 'info');
    });

    SocketClient.onBattleState((data) => {
      this.battleState = data.battle;
      this.render();
      if (this.battleState.status === 'finished') {
        this.phase = 'ended';
        const isWinner = this.battleState.winnerId === App.playerId;
        App.notify(isWinner ? '🎉 你赢了！' : '💀 你输了', isWinner ? 'success' : 'error');
        setTimeout(() => {
          App.showPage('page-lobby');
          App.refreshLobby();
        }, 3000);
      }
    });

    SocketClient.onBattleError((data) => {
      App.notify(data.message, 'error');
    });
  },

  isMyTurn() {
    return this.battleState && this.battleState.currentTurn === App.playerId;
  },

  render() {
    if (!this.battleState) return;

    const s = this.battleState;
    document.getElementById('self-name').textContent = s.self.playerId === App.playerId ? App.username : '对手';
    document.getElementById('self-hp').textContent = `❤ ${s.self.hp}`;
    document.getElementById('self-mana').textContent = `💎 ${s.self.mana}/${s.self.maxMana}`;
    document.getElementById('self-deck-count').textContent = `牌库: ${s.self.deckCount}`;

    document.getElementById('opponent-name').textContent = '对手';
    document.getElementById('opponent-hp').textContent = `❤ ${s.opponent.hp}`;
    document.getElementById('opponent-mana').textContent = `💎 ${s.opponent.mana}/${s.opponent.maxMana}`;
    document.getElementById('opponent-deck-count').textContent = `牌库: ${s.opponent.deckCount}`;
    document.getElementById('opponent-hand-count').textContent = `手牌: ${s.opponent.handCount}`;

    document.getElementById('battle-turn-info').textContent =
      `回合 ${s.turnNumber} - ${this.isMyTurn() ? '🗡 你的回合' : '⏳ 对手回合'}`;

    const endTurnBtn = document.getElementById('btn-end-turn');
    endTurnBtn.disabled = !this.isMyTurn();

    this.renderField('self-field', s.self.field, 'self');
    this.renderField('opponent-field', s.opponent.field, 'opponent');
    this.renderHand(s.self.hand);

    this.setupTargetSelection();
  },

  renderField(containerId, field, side) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (const card of field) {
      const el = CardManager.renderCard(card, {});
      if (side === 'self' && card.canAttack && this.isMyTurn()) {
        el.classList.add('can-attack');
        el.addEventListener('click', () => this.selectAttacker(card));
      }
      if (side === 'opponent') {
        el.addEventListener('click', () => this.selectTarget(card));
      }
      container.appendChild(el);
    }
  },

  renderHand(hand) {
    const container = document.getElementById('self-hand');
    container.innerHTML = '';
    for (const card of hand) {
      const el = CardManager.renderCard(card, {});
      if (this.isMyTurn()) {
        if (card.cost <= (this.battleState.self.mana)) {
          el.addEventListener('click', () => this.playCard(card));
        } else {
          el.style.opacity = '0.5';
        }
      }
      container.appendChild(el);
    }
  },

  playCard(card) {
    if (!this.isMyTurn()) return;
    SocketClient.playCard(this.battleId, card.uid);
  },

  selectAttacker(card) {
    this.selectedCard = card;
    document.querySelectorAll('.self-field .game-card').forEach(el => {
      el.classList.remove('selected');
    });
    document.querySelectorAll('.self-field .game-card').forEach(el => {
      if (parseInt(el.dataset.cardUid) === card.uid) {
        el.classList.add('selected');
      }
    });

    document.querySelectorAll('.opponent-field .game-card').forEach(el => {
      el.classList.add('targetable');
    });
    const oppHero = document.querySelector('.opponent-hero');
    if (oppHero) oppHero.classList.add('targetable');
  },

  selectTarget(card) {
    if (!this.selectedCard) return;
    SocketClient.attack(this.battleId, this.selectedCard.uid, card.uid);
    this.clearSelection();
  },

  selectHeroTarget() {
    if (!this.selectedCard) return;
    SocketClient.attack(this.battleId, this.selectedCard.uid, 'hero');
    this.clearSelection();
  },

  clearSelection() {
    this.selectedCard = null;
    document.querySelectorAll('.game-card').forEach(el => {
      el.classList.remove('selected', 'targetable');
    });
    document.querySelectorAll('.hero-info').forEach(el => {
      el.classList.remove('targetable');
    });
  },

  setupTargetSelection() {
    const oppHero = document.querySelector('.opponent-hero');
    if (oppHero) {
      oppHero.onclick = () => {
        if (this.selectedCard) this.selectHeroTarget();
      };
    }
  },

  endTurn() {
    if (!this.isMyTurn()) return;
    SocketClient.endTurn(this.battleId);
    this.clearSelection();
  },

  concede() {
    if (this.battleId) {
      SocketClient.concede(this.battleId);
    }
  },

  resolveSkillEffect(card, context) {
    const effects = [];
    switch (card.skillName) {
      case 'direct_damage':
        effects.push({ type: 'damage', value: card.attack || 2, target: 'chosen' });
        break;
      case 'aoe_damage':
        effects.push({ type: 'aoe_damage', value: Math.max(1, Math.floor(card.attack / 2)), target: 'all_enemies' });
        break;
      case 'heal':
        effects.push({ type: 'heal', value: card.cost <= 2 ? 3 : 5, target: 'hero' });
        break;
      case 'buff_attack':
        effects.push({ type: 'buff', stat: 'attack', value: card.cost <= 1 ? 2 : 3, target: 'chosen_ally' });
        break;
      case 'buff_defense':
        effects.push({ type: 'buff', stat: 'defense', value: card.cost <= 2 ? 2 : 4, target: 'chosen_ally' });
        break;
      case 'draw_card':
        effects.push({ type: 'draw', count: 2 });
        break;
      case 'freeze':
        effects.push({ type: 'freeze', target: 'chosen_enemy' });
        break;
      case 'reflect':
        effects.push({ type: 'reflect', value: 1 });
        break;
    }
    return effects;
  },

  formatEffectLog(effects, cardName) {
    return effects.map(e => {
      switch (e.type) {
        case 'damage': return `${cardName}: 对目标造成${e.value}点伤害`;
        case 'aoe_damage': return `${cardName}: 对所有敌方造成${e.value}点伤害`;
        case 'heal': return `${cardName}: 恢复${e.value}点生命`;
        case 'buff': return `${cardName}: ${e.stat === 'attack' ? '攻击' : '防御'}+${e.value}`;
        case 'draw': return `${cardName}: 抽${e.count}张牌`;
        case 'freeze': return `${cardName}: 冻结目标`;
        case 'reflect': return `${cardName}: 反弹${e.value}点伤害`;
        default: return `${cardName}: 特效触发`;
      }
    });
  },
};
