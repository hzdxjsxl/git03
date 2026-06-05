import { PlayerStats } from '../types';
import { NormalizedStats } from '../types';

interface PlayerCardProps {
  stats: PlayerStats;
  normalized?: NormalizedStats;
  isSelected: boolean;
  onSelect: () => void;
  rank?: number;
}

export default function PlayerCard({ stats, normalized, isSelected, onSelect, rank }: PlayerCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`glass-card p-3 cursor-pointer transition-all duration-300 ${
        isSelected ? 'ring-2 ring-neon-cyan shadow-lg shadow-neon-cyan/20' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {rank && rank <= 3 && (
          <div className={`text-2xl font-orbitron font-bold ${
            rank === 1 ? 'text-yellow-400 neon-text' :
            rank === 2 ? 'text-gray-300' : 'text-amber-600'
          }`}>
            #{rank}
          </div>
        )}
        
        <img
          src={stats.avatar}
          alt={stats.playerName}
          className="w-12 h-12 rounded-full border-2"
          style={{ borderColor: stats.teamColor }}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-orbitron font-bold text-sm text-white truncate">
              {stats.playerName}
            </h3>
            <span
              className="px-2 py-0.5 text-xs rounded-full font-medium"
              style={{ backgroundColor: stats.teamColor + '30', color: stats.teamColor }}
            >
              {stats.positionName}
            </span>
          </div>
          <p className="text-xs text-gray-400 truncate">{stats.teamName}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2 text-center">
        <div>
          <div className="text-lg font-jetbrains font-bold text-neon-cyan">
            {stats.avgKills.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">击杀</div>
        </div>
        <div>
          <div className="text-lg font-jetbrains font-bold text-red-400">
            {stats.avgDeaths.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">死亡</div>
        </div>
        <div>
          <div className="text-lg font-jetbrains font-bold text-blue-400">
            {stats.avgAssists.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">助攻</div>
        </div>
        <div>
          <div className="text-lg font-jetbrains font-bold text-neon-purple">
            {stats.kda.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">KDA</div>
        </div>
      </div>

      {normalized && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400">综合评分</span>
            <span className="text-neon-cyan font-jetbrains font-bold">
              {normalized.overallScore.toFixed(1)}
            </span>
          </div>
          <div className="h-2 bg-cyber-dark rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${normalized.overallScore}%`,
                background: `linear-gradient(90deg, ${stats.teamColor}, #00F5D4)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
