const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = path.dirname(config.DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.resolve(config.DB_PATH);
let db = null;
let saveTimer = null;

function run(sql, params) {
  if (params && !Array.isArray(params)) params = Object.values(params);
  db.run(sql, params || []);
}

function query(sql, params) {
  if (params && !Array.isArray(params)) params = Object.values(params);
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryOne(sql, params) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function runWithInfo(sql, params) {
  if (params && !Array.isArray(params)) params = Object.values(params);
  db.run(sql, params || []);
  return { changes: db.getRowsModified() };
}

function saveToFile() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!db) return;
    try {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (e) {
      console.error('[DB] Save error:', e.message);
    }
  }, 200);
}

function forceSave() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

async function initialize() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
    console.log('[DB] Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('[DB] Created new database');
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      token TEXT NOT NULL,
      gold INTEGER DEFAULT 300,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('creature','spell','equipment')),
      cost INTEGER NOT NULL DEFAULT 0,
      attack INTEGER NOT NULL DEFAULT 0,
      defense INTEGER NOT NULL DEFAULT 0,
      skill_name TEXT DEFAULT '',
      skill_desc TEXT DEFAULT '',
      target_type TEXT DEFAULT 'none' CHECK(target_type IN ('none','any_enemy','enemy_hero','enemy_minion','all_enemy_minions','all_enemies','friendly_minion','self_hero')),
      rarity TEXT NOT NULL DEFAULT 'common' CHECK(rarity IN ('common','rare','epic','legendary'))
    );

    CREATE TABLE IF NOT EXISTS player_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id TEXT NOT NULL,
      card_id INTEGER NOT NULL,
      count INTEGER DEFAULT 1,
      FOREIGN KEY (player_id) REFERENCES players(id),
      FOREIGN KEY (card_id) REFERENCES cards(id),
      UNIQUE(player_id, card_id)
    );

    CREATE TABLE IF NOT EXISTS decks (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id TEXT NOT NULL,
      card_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
      FOREIGN KEY (card_id) REFERENCES cards(id)
    );

    CREATE TABLE IF NOT EXISTS battles (
      id TEXT PRIMARY KEY,
      player1_id TEXT NOT NULL,
      player2_id TEXT NOT NULL,
      winner_id TEXT,
      status TEXT DEFAULT 'ongoing' CHECK(status IN ('ongoing','finished')),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const CARD_SEED = [
    { name: '哥布林战士', type: 'creature', cost: 2, attack: 2, defense: 2, skill_name: '', skill_desc: '', target_type: 'none', rarity: 'common' },
    { name: '精灵弓手', type: 'creature', cost: 3, attack: 3, defense: 1, skill_name: 'direct_damage', skill_desc: '战吼：对敌方英雄造成1点伤害', target_type: 'enemy_hero', rarity: 'common' },
    { name: '石像鬼', type: 'creature', cost: 4, attack: 1, defense: 5, skill_name: '', skill_desc: '', target_type: 'none', rarity: 'common' },
    { name: '火焰元素', type: 'creature', cost: 5, attack: 4, defense: 3, skill_name: 'aoe_damage', skill_desc: '战吼：对所有敌方随从造成1点伤害', target_type: 'all_enemy_minions', rarity: 'rare' },
    { name: '暗影刺客', type: 'creature', cost: 3, attack: 4, defense: 1, skill_name: 'direct_damage', skill_desc: '战吼：对目标造成2点伤害', target_type: 'any_enemy', rarity: 'rare' },
    { name: '圣骑士', type: 'creature', cost: 5, attack: 3, defense: 4, skill_name: 'heal', skill_desc: '战吼：恢复英雄3点生命', target_type: 'self_hero', rarity: 'rare' },
    { name: '冰霜法师', type: 'creature', cost: 4, attack: 2, defense: 3, skill_name: 'freeze', skill_desc: '战吼：冻结一个敌方随从', target_type: 'enemy_minion', rarity: 'rare' },
    { name: '龙族后裔', type: 'creature', cost: 7, attack: 6, defense: 5, skill_name: 'aoe_damage', skill_desc: '战吼：对所有敌方随从造成2点伤害', target_type: 'all_enemy_minions', rarity: 'legendary' },
    { name: '森林守卫', type: 'creature', cost: 2, attack: 1, defense: 3, skill_name: 'buff_defense', skill_desc: '战吼：使一个友方随从+2防御', target_type: 'friendly_minion', rarity: 'common' },
    { name: '狂战士', type: 'creature', cost: 3, attack: 4, defense: 2, skill_name: 'buff_attack', skill_desc: '战吼：使一个友方随从+2攻击', target_type: 'friendly_minion', rarity: 'common' },
    { name: '火球术', type: 'spell', cost: 3, attack: 0, defense: 0, skill_name: 'direct_damage', skill_desc: '对一个目标造成4点伤害', target_type: 'any_enemy', rarity: 'common' },
    { name: '斩击', type: 'spell', cost: 1, attack: 0, defense: 0, skill_name: 'direct_damage', skill_desc: '对一个目标造成2点伤害', target_type: 'any_enemy', rarity: 'common' },
    { name: '雷霆一击', type: 'spell', cost: 5, attack: 0, defense: 0, skill_name: 'aoe_damage', skill_desc: '对所有敌方随从造成3点伤害', target_type: 'all_enemy_minions', rarity: 'rare' },
    { name: '暗影突袭', type: 'spell', cost: 2, attack: 0, defense: 0, skill_name: 'direct_damage', skill_desc: '对一个目标造成3点伤害', target_type: 'any_enemy', rarity: 'common' },
    { name: '治愈术', type: 'spell', cost: 2, attack: 0, defense: 0, skill_name: 'heal', skill_desc: '恢复英雄4点生命', target_type: 'self_hero', rarity: 'common' },
    { name: '力量祝福', type: 'spell', cost: 1, attack: 0, defense: 0, skill_name: 'buff_attack', skill_desc: '使一个随从+3攻击', target_type: 'friendly_minion', rarity: 'common' },
    { name: '抽牌术', type: 'spell', cost: 1, attack: 0, defense: 0, skill_name: 'draw_card', skill_desc: '抽2张牌', target_type: 'none', rarity: 'common' },
    { name: '火焰风暴', type: 'spell', cost: 6, attack: 0, defense: 0, skill_name: 'aoe_damage', skill_desc: '对所有敌方角色造成3点伤害', target_type: 'all_enemies', rarity: 'epic' },
    { name: '冰冻术', type: 'spell', cost: 3, attack: 0, defense: 0, skill_name: 'freeze', skill_desc: '冻结一个敌方随从', target_type: 'enemy_minion', rarity: 'common' },
    { name: '铁壁', type: 'spell', cost: 2, attack: 0, defense: 0, skill_name: 'buff_defense', skill_desc: '使一个随从+4防御', target_type: 'friendly_minion', rarity: 'common' },
    { name: '护盾术', type: 'spell', cost: 3, attack: 0, defense: 0, skill_name: 'heal', skill_desc: '恢复英雄5点生命并使一个随从+2防御', target_type: 'friendly_minion', rarity: 'rare' },
    { name: '反击之盾', type: 'equipment', cost: 3, attack: 2, defense: 4, skill_name: 'reflect', skill_desc: '装备：受到攻击时反弹1点伤害', target_type: 'none', rarity: 'rare' },
    { name: '狂战之斧', type: 'equipment', cost: 2, attack: 3, defense: 0, skill_name: 'buff_attack', skill_desc: '装备：使装备随从+3攻击', target_type: 'friendly_minion', rarity: 'common' },
    { name: '守护铠甲', type: 'equipment', cost: 3, attack: 0, defense: 5, skill_name: 'buff_defense', skill_desc: '装备：使装备随从+5防御', target_type: 'friendly_minion', rarity: 'rare' },
    { name: '暗影匕首', type: 'equipment', cost: 1, attack: 2, defense: 0, skill_name: 'direct_damage', skill_desc: '装备：战吼对敌方英雄造成1点伤害', target_type: 'enemy_hero', rarity: 'common' },
  ];

  const cardCount = queryOne('SELECT COUNT(*) as cnt FROM cards').cnt;
  if (cardCount === 0) {
    for (const card of CARD_SEED) {
      run(
        'INSERT INTO cards (name, type, cost, attack, defense, skill_name, skill_desc, target_type, rarity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [card.name, card.type, card.cost, card.attack, card.defense, card.skill_name, card.skill_desc, card.target_type, card.rarity]
      );
    }
    forceSave();
    console.log(`[DB] Seeded ${CARD_SEED.length} cards`);
  }

  setInterval(saveToFile, 5000);

  return { run, query, queryOne, runWithInfo, saveToFile, forceSave };
}

module.exports = { initialize, getDb: () => ({ run, query, queryOne, runWithInfo, saveToFile, forceSave }) };
