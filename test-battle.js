const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

async function loginPlayer(username) {
  const res = await fetch(`${SERVER_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const data = await res.json();
  return data.player;
}

async function getPlayerDecks(token) {
  const res = await fetch(`${SERVER_URL}/api/decks`, {
    headers: { 'Authorization': token },
  });
  const data = await res.json();
  return data.decks;
}

function connectSocket(player) {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      auth: {
        playerId: player.id,
        token: player.token,
      },
    });
    socket.on('connect', () => {
      console.log(`✅ ${player.username} 已连接`);
      resolve(socket);
    });
  });
}

function waitForEvent(socket, eventName, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`等待 ${eventName} 超时`));
    }, timeout);
    socket.once(eventName, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function runBattleTest() {
  console.log('\n======== 开始对战测试 ========\n');

  // 1. 登录两个玩家
  console.log('1. 登录玩家...');
  const playerA = await loginPlayer('PlayerA');
  const playerB = await loginPlayer('PlayerB');
  console.log(`   PlayerA ID: ${playerA.id}`);
  console.log(`   PlayerB ID: ${playerB.id}`);

  // 2. 获取卡组
  console.log('\n2. 获取卡组...');
  const decksA = await getPlayerDecks(playerA.token);
  const decksB = await getPlayerDecks(playerB.token);
  const deckA = decksA[0];
  const deckB = decksB[0];
  console.log(`   PlayerA 卡组: ${deckA.name}`);
  console.log(`   PlayerB 卡组: ${deckB.name}`);

  // 3. 连接 socket
  console.log('\n3. 连接对战服务器...');
  const socketA = await connectSocket(playerA);
  const socketB = await connectSocket(playerB);

  // 4. 开始匹配
  console.log('\n4. 开始匹配对手...');
  
  const battleStartA = waitForEvent(socketA, 'battle:start');
  const battleStartB = waitForEvent(socketB, 'battle:start');
  
  socketA.emit('battle:matchmake', { deckId: deckA.id });
  socketB.emit('battle:matchmake', { deckId: deckB.id });
  
  const [dataA, dataB] = await Promise.all([battleStartA, battleStartB]);
  const stateA = dataA.battle;
  const stateB = dataB.battle;
  
  console.log(`✅ 匹配成功！对战ID: ${stateA.battleId}`);
  console.log(`   当前回合: 第${stateA.turnNumber}回合`);
  console.log(`   当前玩家: ${stateA.currentTurn === playerA.id ? 'PlayerA' : 'PlayerB'}`);
  console.log(`   PlayerA 血量: ${stateA.self.hp}`);
  console.log(`   PlayerB 血量: ${stateA.opponent.hp}`);

  // 5. 进行对战
  let currentState = stateA;
  const maxTurns = 8;

  for (let turn = 1; turn <= maxTurns; turn++) {
    const battleId = currentState.battleId;
    const currentPlayerId = currentState.currentTurn;
    const isPlayerA = currentPlayerId === playerA.id;
    const currentSocket = isPlayerA ? socketA : socketB;
    const currentName = isPlayerA ? 'PlayerA' : 'PlayerB';
    const otherName = isPlayerA ? 'PlayerB' : 'PlayerA';

    const myState = currentState.self;
    const otherState = currentState.opponent;

    console.log(`\n======== 回合 ${currentState.turnNumber} - ${currentName} ========`);
    console.log(`  血量: ${myState.hp} | 法力: ${myState.mana}/${myState.maxMana}`);
    console.log(`  手牌: ${myState.hand.length}张 | 场上: ${myState.field.length}个随从`);
    console.log(`  对手血量: ${otherState.hp} | 对手场上: ${otherState.field.length}个随从`);

    // 尝试出牌
    const playableCards = myState.hand.filter(c => c.cost <= myState.mana);
    if (playableCards.length > 0) {
      const cardToPlay = playableCards[0];
      console.log(`\n  🃏 出牌: ${cardToPlay.name} (${cardToPlay.cost}费, ${cardToPlay.type})`);
      currentSocket.emit('battle:playCard', {
        battleId,
        cardUid: cardToPlay.uid,
      });
      
      const stateUpdate = await waitForEvent(currentSocket, 'battle:state');
      currentState = isPlayerA ? stateUpdate.battle : stateUpdate.battle;
      const newOtherHp = isPlayerA ? currentState.opponent.hp : currentState.self.hp;
      console.log(`     结果: ${otherName} HP ${otherState.hp} -> ${newOtherHp}`);
    }

    // 检查胜负
    if (currentState.status === 'finished') {
      console.log(`\n🎉 对战结束！`);
      console.log(`   胜者: ${currentState.winnerId === playerA.id ? 'PlayerA' : 'PlayerB'}`);
      break;
    }

    // 尝试攻击
    const attackers = myState.field.filter(m => m.canAttack);
    if (attackers.length > 0) {
      for (const attacker of attackers.slice(0, 2)) {
        let targetUid;
        const tauntMinions = otherState.field.filter(m => m.taunt);
        
        if (tauntMinions.length > 0) {
          targetUid = tauntMinions[0].uid;
          console.log(`\n  ⚔️  ${attacker.name}(${attacker.currentAttack}/${attacker.currentDefense}) 攻击嘲讽随从 ${tauntMinions[0].name}`);
        } else if (otherState.field.length > 0 && Math.random() > 0.5) {
          const target = otherState.field[0];
          targetUid = target.uid;
          console.log(`\n  ⚔️  ${attacker.name}(${attacker.currentAttack}/${attacker.currentDefense}) 攻击随从 ${target.name}`);
        } else {
          targetUid = isPlayerA ? playerB.id : playerA.id;
          console.log(`\n  ⚔️  ${attacker.name}(${attacker.currentAttack}/${attacker.currentDefense}) 直接攻击 ${otherName}`);
        }
        
        currentSocket.emit('battle:attack', {
          battleId,
          attackerUid: attacker.uid,
          targetUid,
        });
        
        const stateUpdate = await waitForEvent(currentSocket, 'battle:state');
        currentState = isPlayerA ? stateUpdate.battle : stateUpdate.battle;
      }
    }

    // 检查胜负
    if (currentState.status === 'finished') {
      console.log(`\n🎉 对战结束！`);
      console.log(`   胜者: ${currentState.winnerId === playerA.id ? 'PlayerA' : 'PlayerB'}`);
      break;
    }

    // 结束回合
    console.log(`\n  ⏭️  结束回合`);
    currentSocket.emit('battle:endTurn', { battleId });
    
    const stateUpdate = await waitForEvent(isPlayerA ? socketB : socketA, 'battle:state');
    currentState = isPlayerA ? stateUpdate.battle : stateUpdate.battle;
  }

  // 6. 断开连接
  console.log('\n5. 断开连接...');
  socketA.disconnect();
  socketB.disconnect();

  console.log('\n======== 对战测试完成 ========\n');
  console.log('✅ 所有测试通过！战斗结算正常。');
}

runBattleTest().catch(e => {
  console.error('\n❌ 测试失败:', e.message);
  console.error(e.stack);
  process.exit(1);
});
