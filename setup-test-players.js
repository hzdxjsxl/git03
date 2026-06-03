async function setupPlayer(username) {
  console.log(`\n===== 设置 ${username} =====`);

  const loginRes = await fetch('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  const loginData = await loginRes.json();
  const token = loginData.player.token;
  console.log(`✅ 注册成功, 初始金币: ${loginData.player.gold}`);

  for (let i = 1; i <= 4; i++) {
    const packRes = await fetch('http://localhost:3000/api/cards/pack', {
      method: 'POST',
      headers: { 'Authorization': token },
    });
    const packData = await packRes.json();
    const cards = packData.cards.map(c => c.name);
    console.log(`第${i}包: ${cards.join(', ')}`);
  }

  const collRes = await fetch('http://localhost:3000/api/cards/collection', {
    headers: { 'Authorization': token },
  });
  const collData = await collRes.json();
  const totalCards = collData.collection.reduce((s, c) => s + c.owned, 0);
  const maxDeckSize = collData.collection.reduce((s, c) => s + Math.min(c.owned, 2), 0);
  console.log(`\n卡牌总数: ${totalCards}, 可组卡组: ${maxDeckSize}张`);

  const deckCards = [];
  for (const card of collData.collection) {
    const count = Math.min(card.owned, 2);
    if (count > 0) {
      deckCards.push({ cardId: card.id, quantity: count });
    }
  }

  const total = deckCards.reduce((s, c) => s + c.quantity, 0);
  console.log(`准备保存卡组，共${total}张`);

  const deckRes = await fetch('http://localhost:3000/api/decks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': token },
    body: JSON.stringify({ name: `${username}的卡组`, cards: deckCards }),
  });
  const deckData = await deckRes.json();
  if (deckData.deck) {
    const deckTotal = deckCards.reduce((s, c) => s + c.quantity, 0);
    console.log(`✅ 卡组保存成功! 卡组ID: ${deckData.deck.id}, 张数: ${deckTotal}`);
  } else {
    console.log(`❌ 卡组保存失败: ${JSON.stringify(deckData)}`);
  }

  return { token, playerId: loginData.player.id };
}

async function main() {
  console.log('\n======== 自动化创建测试账号 ========\n');
  const playerA = await setupPlayer('PlayerA');
  const playerB = await setupPlayer('PlayerB');
  console.log('\n======== 账号设置完成 ========');
  console.log('PlayerA token:', playerA.token);
  console.log('PlayerB token:', playerB.token);
  console.log('\n现在可以用浏览器打开 http://localhost:3000 进行对战测试了');
}

main().catch(e => { console.error(e); process.exit(1); });
