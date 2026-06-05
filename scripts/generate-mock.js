const fs = require('fs');
const path = require('path');

const TEAMS = [
  { id: 't1', name: '雷霆战队', color: '#00F5D4' },
  { id: 't2', name: '烈焰军团', color: '#FF6B6B' },
  { id: 't3', name: '暗影骑士', color: '#7C3AED' },
  { id: 't4', name: '星辰之光', color: '#FBBF24' },
  { id: 't5', name: '暴风之怒', color: '#3B82F6' },
  { id: 't6', name: '冰霜守卫', color: '#06B6D4' }
];

const POSITIONS = [
  { key: 'top', name: '上单' },
  { key: 'jungle', name: '打野' },
  { key: 'mid', name: '中单' },
  { key: 'adc', name: 'ADC' },
  { key: 'support', name: '辅助' }
];

const PLAYER_NAMES = [
  'ShadowStrike', 'BlazeKing', 'NightHawk', 'PhoenixRider', 'StormBreaker',
  'IceQueen', 'ThunderGod', 'ViperX', 'DragonSlayer', 'GhostWalker',
  'Sentinel', 'Raven', 'Titan', 'Nebula', 'Cosmic',
  'Inferno', 'Aurora', 'Zenith', 'Quantum', 'Mystic',
  'Blizzard', 'Cyclone', 'Ember', 'FrostByte', 'Tsunami'
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generatePlayers() {
  const players = [];
  let playerIndex = 0;

  TEAMS.forEach(team => {
    POSITIONS.forEach(position => {
      const playerName = PLAYER_NAMES[playerIndex % PLAYER_NAMES.length];
      players.push({
        id: `p${playerIndex + 1}`,
        name: playerName,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        position: position.key,
        positionName: position.name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerName}`
      });
      playerIndex++;
    });
  });

  return players;
}

function generateMatches(players, matchCount = 15) {
  const matches = [];
  const startDate = new Date('2026-01-01');

  for (let matchNum = 1; matchNum <= matchCount; matchNum++) {
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + (matchNum - 1) * 3);
    const dateStr = matchDate.toISOString().split('T')[0];

    players.forEach(player => {
      const positionBonus = getPositionBonus(player.position);
      
      matches.push({
        id: `m${matchNum}_${player.id}`,
        matchId: `match${matchNum}`,
        matchDate: dateStr,
        matchNumber: matchNum,
        playerId: player.id,
        kills: Math.max(0, Math.floor(positionBonus.kill * randomBetween(2, 12))),
        deaths: Math.max(1, randomBetween(1, 8)),
        assists: Math.floor(positionBonus.assist * randomBetween(3, 18)),
        survivalTime: randomFloat(1200, 2400, 0),
        distance: randomFloat(8000, 25000, 0),
        gold: Math.floor(randomBetween(10000, 22000) * positionBonus.gold),
        damage: Math.floor(randomBetween(15000, 45000) * positionBonus.damage),
        visionScore: Math.floor(randomBetween(20, 150) * positionBonus.vision),
        crowdControl: Math.floor(randomBetween(10, 120) * positionBonus.cc),
        cs: Math.floor(randomBetween(150, 350) * positionBonus.cs)
      });
    });
  }

  return matches;
}

function getPositionBonus(position) {
  const bonuses = {
    top: { kill: 0.9, assist: 0.8, gold: 1.0, damage: 1.0, vision: 0.7, cc: 1.1, cs: 1.1 },
    jungle: { kill: 1.1, assist: 1.2, gold: 0.95, damage: 0.95, vision: 1.0, cc: 1.2, cs: 0.8 },
    mid: { kill: 1.2, assist: 0.9, gold: 1.1, damage: 1.2, vision: 0.8, cc: 0.9, cs: 1.15 },
    adc: { kill: 1.3, assist: 0.7, gold: 1.2, damage: 1.3, vision: 0.6, cc: 0.5, cs: 1.25 },
    support: { kill: 0.5, assist: 1.5, gold: 0.7, damage: 0.6, vision: 1.4, cc: 1.4, cs: 0.3 }
  };
  return bonuses[position] || bonuses.mid;
}

function main() {
  console.log('🎮 正在生成电竞模拟数据...');

  const players = generatePlayers();
  const matches = generateMatches(players, 15);

  const dataDir = path.join(__dirname, '../server/mock');
  
  fs.writeFileSync(
    path.join(dataDir, 'players.json'),
    JSON.stringify({ players }, null, 2)
  );
  console.log(`✅ 生成 ${players.length} 名选手数据`);

  fs.writeFileSync(
    path.join(dataDir, 'matches.json'),
    JSON.stringify({ matches }, null, 2)
  );
  console.log(`✅ 生成 ${matches.length} 条比赛记录`);
  console.log(`✅ 共 ${new Set(matches.map(m => m.matchId)).size} 场比赛`);

  fs.writeFileSync(
    path.join(dataDir, 'teams.json'),
    JSON.stringify({ teams: TEAMS }, null, 2)
  );
  console.log(`✅ 生成 ${TEAMS.length} 支战队数据`);

  console.log('\n🎉 数据生成完成！文件已保存到 server/mock/ 目录');
}

main();
