const BattleClient = {
  battleId: null,
  battleState: null,
  selectedCard: null,
  selectedAttacker: null,
  phase: 'idle',
  needsTarget: false,
  targetType: 'none',

  init() {
    SocketClient.onBattleStart((data) => {
      this.battleState = data.battle;
      this.battleId = data.battle.battleId;
      this.phase = 'playing';
      App.showPage('page-battle');
      this.render();
      this.renderLog();
      App.notify('对战开始！', 'info');
    });

    SocketClient.onBattleState((data) => {
      this.battleState = data.battle;
      this.render();
      this.renderLog();
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

  cardNeedsTarget(card) {
    const needTargetTypes = ['any_enemy', 'enemy_hero', 'enemy_minion', 'friendly_minion'];
    return needTargetTypes.includes(card.target_type);
  },

  getTargetTypeDesc(targetType) {
    const desc = {
      'any_enemy': '选择一个敌方目标',
      'enemy_hero': '只能对敌方英雄使用',
      'enemy_minion': '只能对敌方随从使用',
      'friendly_minion': '只能对友方随从使用',
      'self_hero': '对自己英雄使用',
      'all_enemy_minions': '对所有敌方随从生效',
      'all_enemies': '对所有敌方生效',
      'none': '无需目标',
    };
    return desc[targetType] || '';
  },

  canTargetEnemyHero(card) {
    return card.target_type === 'any_enemy' || card.target_type === 'enemy_hero';
  },

  canTargetEnemyMinion(card) {
    return card.target_type === 'any_enemy' || card.target_type === 'enemy_minion';
  },

  canTargetFriendlyMinion(card) {
    return card.target_type === 'friendly_minion';
  },

  canTargetFriendlyHero(card) {
    return card.target_type === 'self_hero';
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
    this.updateTargetHint();
  },

  updateTargetHint() {
    const hintEl = document.getElementById('target-hint');
    if (!hintEl) return;
    
    if (this.needsTarget && this.selectedCard) {
      const hint = this.getTargetTypeDesc(this.selectedCard.target_type);
      hintEl.textContent = hint;
      hintEl.style.display = 'block';
    } else if (this.selectedAttacker) {
      hintEl.textContent = '选择攻击目标（敌方随从或英雄）';
      hintEl.style.display = 'block';
    } else {
      hintEl.style.display = 'none';
    }
  },

  renderLog() {
    if (!this.battleState || !this.battleState.log) return;
    const logEl = document.getElementById('battle-log');
    logEl.innerHTML = '';
    for (const entry of this.battleState.log.slice(-8)) {
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.textContent = entry.message;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  },

  renderField(containerId, field, side) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (const card of field) {
      const el = CardManager.renderCard(card, {});
      if (card.frozen) {
        el.style.filter = 'hue-rotate(180deg)';
        el.style.boxShadow = '0 0 10px #00f';
      }
      
      if (side === 'self') {
        if (card.canAttack && this.isMyTurn() && !card.frozen) {
          el.classList.add('can-attack');
          el.addEventListener('click', () => this.selectAttacker(card));
        }
        if (this.needsTarget && this.selectedCard && this.canTargetFriendlyMinion(this.selectedCard)) {
          el.classList.add('targetable');
          el.addEventListener('click', () => this.selectTarget(card, 'friendly_minion'));
        }
      }
      
      if (side === 'opponent') {
        if (this.selectedAttacker) {
          el.classList.add('targetable');
          el.addEventListener('click', () => this.selectTarget(card, 'enemy_minion'));
        }
        if (this.needsTarget && this.selectedCard && this.canTargetEnemyMinion(this.selectedCard)) {
          el.classList.add('targetable');
          el.addEventListener('click', () => this.selectTarget(card, 'enemy_minion'));
        }
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
          if (this.selectedCard && this.selectedCard.uid === card.uid) {
            el.classList.add('selected');
          }
        } else {
          el.style.opacity = '0.5';
        }
      }
      container.appendChild(el);
    }
  },

  playCard(card) {
    if (!this.isMyTurn()) return;
    
    const targetType = card.target_type || 'none';
    
    if (this.cardNeedsTarget(card)) {
      this.selectedCard = card;
      this.needsTarget = true;
      this.targetType = targetType;
      this.selectedAttacker = null;
      this.render();
      
      const hint = this.getTargetTypeDesc(targetType);
      if (hint) App.notify(hint, 'info');
    } else {
      SocketClient.playCard(this.battleId, card.uid, null);
      this.clearSelection();
    }
  },

  selectAttacker(card) {
    if (!this.isMyTurn()) return;
    this.selectedAttacker = card;
    this.selectedCard = null;
    this.needsTarget = false;
    this.targetType = 'none';
    this.render();
    App.notify('选择攻击目标', 'info');
  },

  selectTarget(card, targetSide) {
    if (this.needsTarget && this.selectedCard) {
      const cardTargetType = this.selectedCard.target_type;
      
      if (cardTargetType === 'enemy_minion' && targetSide !== 'enemy_minion') {
        App.notify('这张牌只能对敌方随从使用！', 'error');
        return;
      }
      if (cardTargetType === 'friendly_minion' && targetSide !== 'friendly_minion') {
        App.notify('这张牌只能对友方随从使用！', 'error');
        return;
      }
      
      SocketClient.playCard(this.battleId, this.selectedCard.uid, card.uid);
      this.clearSelection();
    } else if (this.selectedAttacker) {
      if (targetSide !== 'enemy_minion') {
        App.notify('只能攻击敌方目标！', 'error');
        return;
      }
      SocketClient.attack(this.battleId, this.selectedAttacker.uid, card.uid);
      this.clearSelection();
    }
  },

  selectHeroTarget(side) {
    if (this.needsTarget && this.selectedCard) {
      const cardTargetType = this.selectedCard.target_type;
      
      if (side === 'opponent') {
        if (cardTargetType === 'enemy_minion') {
          App.notify('这张牌只能对敌方随从使用，不能对英雄使用！', 'error');
          return;
        }
        if (cardTargetType === 'friendly_minion' || cardTargetType === 'self_hero') {
          App.notify('这张牌不能对敌方英雄使用！', 'error');
          return;
        }
        if (!this.canTargetEnemyHero(this.selectedCard)) {
          App.notify('这张牌不能对敌方英雄使用！', 'error');
          return;
        }
        SocketClient.playCard(this.battleId, this.selectedCard.uid, 'hero');
      } else {
        if (cardTargetType === 'enemy_minion' || cardTargetType === 'any_enemy' || cardTargetType === 'enemy_hero') {
          App.notify('这张牌不能对友方英雄使用！', 'error');
          return;
        }
        if (!this.canTargetFriendlyHero(this.selectedCard)) {
          App.notify('这张牌不能对友方英雄使用！', 'error');
          return;
        }
        SocketClient.playCard(this.battleId, this.selectedCard.uid, null);
      }
      this.clearSelection();
    } else if (this.selectedAttacker) {
      if (side !== 'opponent') {
        App.notify('只能攻击敌方英雄！', 'error');
        return;
      }
      SocketClient.attack(this.battleId, this.selectedAttacker.uid, 'hero');
      this.clearSelection();
    }
  },

  clearSelection() {
    this.selectedCard = null;
    this.selectedAttacker = null;
    this.needsTarget = false;
    this.targetType = 'none';
    this.render();
  },

  setupTargetSelection() {
    const oppHero = document.querySelector('.opponent-hero');
    const selfHero = document.querySelector('.self-hero');
    
    if (oppHero) {
      oppHero.classList.remove('targetable');
      if (this.selectedAttacker) {
        oppHero.classList.add('targetable');
      }
      if (this.needsTarget && this.selectedCard && this.canTargetEnemyHero(this.selectedCard)) {
        oppHero.classList.add('targetable');
      }
      oppHero.onclick = () => this.selectHeroTarget('opponent');
    }
    
    if (selfHero) {
      selfHero.classList.remove('targetable');
      if (this.needsTarget && this.selectedCard && this.canTargetFriendlyHero(this.selectedCard)) {
        selfHero.classList.add('targetable');
      }
      selfHero.onclick = () => this.selectHeroTarget('self');
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
};
