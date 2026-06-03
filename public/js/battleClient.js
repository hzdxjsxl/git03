const BattleClient = {
  battleId: null,
  battleState: null,
  selectedCard: null,
  selectedAttacker: null,
  phase: 'idle',
  needsTarget: false,

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

  renderLog() {
    if (!this.battleState || !this.battleState.log) return;
    const logEl = document.getElementById('battle-log');
    logEl.innerHTML = '';
    logEl.classList.add('visible');
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
      if (side === 'self' && card.canAttack && this.isMyTurn() && !card.frozen) {
        el.classList.add('can-attack');
        el.addEventListener('click', () => this.selectAttacker(card));
      }
      if (side === 'opponent' && (this.selectedAttacker || this.needsTarget)) {
        el.classList.add('targetable');
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

  cardNeedsTarget(card) {
    const targetSkills = ['direct_damage', 'buff_attack', 'buff_defense', 'freeze'];
    return targetSkills.includes(card.skill_name);
  },

  playCard(card) {
    if (!this.isMyTurn()) return;
    
    if (this.cardNeedsTarget(card)) {
      this.selectedCard = card;
      this.needsTarget = true;
      this.render();
      App.notify('请选择目标', 'info');
    } else {
      SocketClient.playCard(this.battleId, card.uid);
      this.clearSelection();
    }
  },

  selectAttacker(card) {
    this.selectedAttacker = card;
    this.selectedCard = null;
    this.needsTarget = false;
    this.render();
  },

  selectTarget(card) {
    if (this.needsTarget && this.selectedCard) {
      const isFriendly = card.ownerId === App.playerId;
      const friendlyBuffs = ['buff_attack', 'buff_defense'];
      const isFriendlyBuff = friendlyBuffs.includes(this.selectedCard.skill_name);
      
      if (isFriendlyBuff && !isFriendly) {
        App.notify('请选择己方随从', 'error');
        return;
      }
      if (!isFriendlyBuff && isFriendly) {
        App.notify('请选择敌方目标', 'error');
        return;
      }
      
      SocketClient.playCard(this.battleId, this.selectedCard.uid, card.uid);
      this.clearSelection();
    } else if (this.selectedAttacker) {
      SocketClient.attack(this.battleId, this.selectedAttacker.uid, card.uid);
      this.clearSelection();
    }
  },

  selectHeroTarget() {
    if (this.needsTarget && this.selectedCard) {
      const hostileSkills = ['direct_damage'];
      if (!hostileSkills.includes(this.selectedCard.skill_name)) {
        App.notify('该技能不能对英雄使用', 'error');
        return;
      }
      SocketClient.playCard(this.battleId, this.selectedCard.uid, 'hero');
      this.clearSelection();
    } else if (this.selectedAttacker) {
      SocketClient.attack(this.battleId, this.selectedAttacker.uid, 'hero');
      this.clearSelection();
    }
  },

  clearSelection() {
    this.selectedCard = null;
    this.selectedAttacker = null;
    this.needsTarget = false;
    this.render();
  },

  setupTargetSelection() {
    const oppHero = document.querySelector('.opponent-hero');
    const selfHero = document.querySelector('.self-hero');
    
    if (oppHero) {
      oppHero.classList.remove('targetable');
      if (this.selectedAttacker || (this.needsTarget && this.selectedCard && 
          ['direct_damage', 'freeze'].includes(this.selectedCard.skill_name))) {
        oppHero.classList.add('targetable');
      }
      oppHero.onclick = () => {
        if (this.selectedAttacker || (this.needsTarget && this.selectedCard)) {
          this.selectHeroTarget();
        }
      };
    }
    
    if (selfHero) {
      selfHero.classList.remove('targetable');
      if (this.needsTarget && this.selectedCard && 
          ['buff_attack', 'buff_defense', 'heal'].includes(this.selectedCard.skill_name)) {
        selfHero.classList.add('targetable');
      }
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
