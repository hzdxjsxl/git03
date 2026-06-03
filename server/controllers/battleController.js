const battleModel = require('../models/battleModel');
const battleView = require('../views/battleView');
const playerModel = require('../models/playerModel');

function getBattleState(req, res) {
  const battle = battleModel.getBattle(req.params.battleId);
  if (!battle) {
    return res.status(404).json({ error: '战斗不存在' });
  }
  const state = battleModel.sanitizeForPlayer(battle, req.player.id);
  res.json({ battle: battleView.formatBattleState(state) });
}

function getPlayerInfo(req, res) {
  const gold = playerModel.getGold(req.player.id);
  res.json({ player: { id: req.player.id, username: req.player.username, gold } });
}

module.exports = {
  getBattleState,
  getPlayerInfo,
};
