const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const deckController = require('../controllers/deckController');
const battleController = require('../controllers/battleController');
const playerModel = require('../models/playerModel');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: '未登录' });
  const player = playerModel.findByToken(token);
  if (!player) return res.status(401).json({ error: 'token无效' });
  req.player = player;
  next();
}

router.post('/auth/register', (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: '用户名不能为空' });
  if (playerModel.findByUsername(username)) {
    return res.status(400).json({ error: '用户名已存在' });
  }
  const player = playerModel.createPlayer(username);
  res.json({ player: { id: player.id, username: player.username, token: player.token, gold: player.gold } });
});

router.post('/auth/login', (req, res) => {
  const { username } = req.body;
  const player = playerModel.findByUsername(username);
  if (!player) return res.status(404).json({ error: '用户不存在' });
  res.json({ player: { id: player.id, username: player.username, token: player.token, gold: player.gold } });
});

router.get('/player/info', authMiddleware, battleController.getPlayerInfo);

router.get('/cards', cardController.getAllCards);
router.get('/cards/collection', authMiddleware, cardController.getPlayerCollection);
router.post('/cards/pack', authMiddleware, cardController.openPack);

router.get('/decks', authMiddleware, deckController.getDecks);
router.get('/decks/:deckId', authMiddleware, deckController.getDeck);
router.post('/decks', authMiddleware, deckController.createDeck);
router.delete('/decks/:deckId', authMiddleware, deckController.deleteDeck);

router.get('/battles/:battleId', authMiddleware, battleController.getBattleState);

module.exports = router;
