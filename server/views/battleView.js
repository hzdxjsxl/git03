function formatBattleState(battleState) {
  return battleState;
}

function formatBattleResult(battle) {
  return {
    battleId: battle.id,
    status: battle.status,
    winnerId: battle.winnerId,
  };
}

module.exports = {
  formatBattleState,
  formatBattleResult,
};
