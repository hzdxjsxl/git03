const { getDb } = require('./database');
const { v4: uuidv4 } = require('uuid');

function createPlayer(username) {
  const { run, saveToFile } = getDb();
  const id = uuidv4();
  const token = uuidv4();
  run('INSERT INTO players (id, username, token) VALUES (?, ?, ?)', [id, username, token]);
  saveToFile();
  return { id, username, token };
}

function findByToken(token) {
  const { queryOne } = getDb();
  return queryOne('SELECT * FROM players WHERE token = ?', [token]);
}

function findById(id) {
  const { queryOne } = getDb();
  return queryOne('SELECT * FROM players WHERE id = ?', [id]);
}

function findByUsername(username) {
  const { queryOne } = getDb();
  return queryOne('SELECT * FROM players WHERE username = ?', [username]);
}

function updateGold(playerId, delta) {
  const { run, saveToFile } = getDb();
  run('UPDATE players SET gold = gold + ? WHERE id = ?', [delta, playerId]);
  saveToFile();
}

function getGold(playerId) {
  const { queryOne } = getDb();
  const row = queryOne('SELECT gold FROM players WHERE id = ?', [playerId]);
  return row ? row.gold : 0;
}

module.exports = {
  createPlayer,
  findByToken,
  findById,
  findByUsername,
  updateGold,
  getGold,
};
