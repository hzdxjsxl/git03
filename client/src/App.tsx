import { useState, useEffect, useMemo } from 'react';
import { Player, MatchRecord, PlayerStats } from './types';
import {
  aggregatePlayerStats,
  normalizeStats,
  generateRadarData,
  generateScatterData,
  generateTrendData,
  filterByPosition,
  filterByTeam,
  sortPlayers,
  FIELD_LABELS,
} from './utils/dataProcessor';
import RadarChart from './components/RadarChart';
import ScatterChart from './components/ScatterChart';
import LineChart from './components/LineChart';
import PlayerCard from './components/PlayerCard';

const POSITIONS = [
  { key: 'all', name: '全部位置' },
  { key: 'top', name: '上单' },
  { key: 'jungle', name: '打野' },
  { key: 'mid', name: '中单' },
  { key: 'adc', name: 'ADC' },
  { key: 'support', name: '辅助' },
];

const SCATTER_FIELDS = [
  { key: 'avgKills', name: '场均击杀' },
  { key: 'avgDeaths', name: '场均死亡' },
  { key: 'avgAssists', name: '场均助攻' },
  { key: 'kda', name: 'KDA' },
  { key: 'avgDamage', name: '场均输出' },
  { key: 'avgGold', name: '场均经济' },
];

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [sortBy, setSortBy] = useState<keyof PlayerStats>('kda');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [scatterX, setScatterX] = useState<keyof PlayerStats>('avgKills');
  const [scatterY, setScatterY] = useState<keyof PlayerStats>('avgDamage');

  const API_BASE = 'http://localhost:3001';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playersRes, matchesRes] = await Promise.all([
          fetch(`${API_BASE}/api/players`),
          fetch(`${API_BASE}/api/matches`),
        ]);
        const playersData = await playersRes.json();
        const matchesData = await matchesRes.json();
        setPlayers(playersData.players);
        setMatches(matchesData.matches);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const teams = useMemo(() => {
    if (!players || players.length === 0) return ['all'];
    const teamSet = new Set(players.map(p => p.teamName));
    return ['all', ...Array.from(teamSet)];
  }, [players]);

  const playerStats = useMemo(() => {
    if (!players || !matches) return [];
    return aggregatePlayerStats(players, matches) || [];
  }, [players, matches]);

  const filteredStats = useMemo(() => {
    if (!playerStats || playerStats.length === 0) return [];
    let result = filterByPosition(playerStats, selectedPosition);
    result = filterByTeam(result, selectedTeam);
    result = sortPlayers(result, sortBy);
    return result || [];
  }, [playerStats, selectedPosition, selectedTeam, sortBy]);

  const normalizedStats = useMemo(() => {
    if (!playerStats) return new Map();
    return normalizeStats(playerStats);
  }, [playerStats]);

  const selectedPlayers = useMemo(() => {
    if (!filteredStats) return [];
    return filteredStats.filter(p => selectedPlayerIds.includes(p.playerId)).slice(0, 5);
  }, [filteredStats, selectedPlayerIds]);

  const radarData = useMemo(() => {
    if (!filteredStats || !normalizedStats) return [];
    const playersForRadar = selectedPlayers.length > 0 ? selectedPlayers : filteredStats.slice(0, 5);
    return generateRadarData(playersForRadar, normalizedStats);
  }, [selectedPlayers, filteredStats, normalizedStats]);

  const scatterData = useMemo(() => {
    if (!filteredStats) return [];
    return generateScatterData(filteredStats, scatterX, scatterY, 'avgDamage');
  }, [filteredStats, scatterX, scatterY]);

  const trendData = useMemo(() => {
    if (selectedPlayers.length === 0) return null;
    if (!matches) return null;
    return generateTrendData(selectedPlayers[0].playerId, matches, ['kills', 'assists', 'deaths']);
  }, [selectedPlayers, matches]);

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      }
      return [...prev, playerId];
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center grid-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-orbitron text-neon-cyan text-lg">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid-bg">
      <header className="sticky top-0 z-50 bg-cyber-darker/80 backdrop-blur-lg border-b border-neon-cyan/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center animate-pulse-glow">
                <span className="text-2xl">🎮</span>
              </div>
              <div>
                <h1 className="font-orbitron text-xl font-bold text-white">
                  ESPORTS <span className="text-neon-cyan">ANALYTICS</span>
                </h1>
                <p className="text-xs text-gray-400">电竞选手赛后数据分析面板</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="px-3 py-2 bg-cyber-blue/50 border border-neon-cyan/30 rounded-lg text-sm text-white focus:outline-none focus:border-neon-cyan"
              >
                {POSITIONS.map(pos => (
                  <option key={pos.key} value={pos.key}>{pos.name}</option>
                ))}
              </select>

              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="px-3 py-2 bg-cyber-blue/50 border border-neon-cyan/30 rounded-lg text-sm text-white focus:outline-none focus:border-neon-cyan"
              >
                {teams.map(team => (
                  <option key={team} value={team}>{team === 'all' ? '全部战队' : team}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as keyof PlayerStats)}
                className="px-3 py-2 bg-cyber-blue/50 border border-neon-cyan/30 rounded-lg text-sm text-white focus:outline-none focus:border-neon-cyan"
              >
                <option value="kda">按 KDA 排序</option>
                <option value="avgKills">按击杀排序</option>
                <option value="avgDamage">按输出排序</option>
                <option value="avgGold">按经济排序</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="glass-card p-4 mb-4">
              <h2 className="font-orbitron font-bold text-neon-cyan mb-3 flex items-center gap-2">
                <span>👥</span> 选手列表
                <span className="text-xs text-gray-400 font-normal">({filteredStats.length})</span>
              </h2>
              <p className="text-xs text-gray-400 mb-3">点击选择选手进行对比（最多5名）</p>
            </div>
            <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin pr-1">
              {filteredStats.map((stats, index) => (
                <div
                  key={stats.playerId}
                  className="animate-fade-in-up opacity-0"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <PlayerCard
                    stats={stats}
                    normalized={normalizedStats.get(stats.playerId)}
                    isSelected={selectedPlayerIds.includes(stats.playerId)}
                    onSelect={() => togglePlayerSelection(stats.playerId)}
                    rank={index + 1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-4 animate-fade-in-up opacity-0 animate-stagger-1">
              <RadarChart data={radarData} title="选手能力六维图" />
              {selectedPlayers.length === 0 && (
                <p className="text-center text-xs text-gray-500 mt-2">💡 从左侧选择选手进行对比分析</p>
              )}
            </div>

            <div className="glass-card p-4 animate-fade-in-up opacity-0 animate-stagger-2">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <h3 className="font-orbitron text-sm text-neon-cyan">Scatter Config</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={scatterX}
                    onChange={(e) => setScatterX(e.target.value as keyof PlayerStats)}
                    className="px-2 py-1 bg-cyber-blue/50 border border-neon-cyan/30 rounded text-xs text-white"
                  >
                    {SCATTER_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>X: {f.name}</option>
                    ))}
                  </select>
                  <span className="text-neon-cyan">→</span>
                  <select
                    value={scatterY}
                    onChange={(e) => setScatterY(e.target.value as keyof PlayerStats)}
                    className="px-2 py-1 bg-cyber-blue/50 border border-neon-cyan/30 rounded text-xs text-white"
                  >
                    {SCATTER_FIELDS.map(f => (
                      <option key={f.key} value={f.key}>Y: {f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="bg-cyber-dark/50 rounded-lg overflow-hidden">
                <ScatterChart
                  data={scatterData}
                  title="Player Data Distribution"
                  xAxisLabel={FIELD_LABELS[scatterX] || scatterX}
                  yAxisLabel={FIELD_LABELS[scatterY] || scatterY}
                />
              </div>
            </div>

            {trendData && trendData.length > 0 ? (
              <div className="glass-card p-4 animate-fade-in-up opacity-0 animate-stagger-3">
                <LineChart
                  data={trendData}
                  fields={['kills', 'assists', 'deaths']}
                  playerName={selectedPlayers[0]?.playerName}
                  title="比赛表现趋势"
                />
              </div>
            ) : (
              <div className="glass-card p-8 text-center animate-fade-in-up opacity-0 animate-stagger-3">
                <div className="text-4xl mb-3">📈</div>
                <h3 className="font-orbitron text-neon-cyan mb-2">趋势分析</h3>
                <p className="text-sm text-gray-400">选择一名选手查看其多场比赛表现趋势</p>
              </div>
            )}
          </div>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-500 py-4 border-t border-neon-cyan/10">
          <p>🎮 电竞数据分析面板 | 数据由前端清洗归一化处理</p>
        </footer>
      </main>
    </div>
  );
}
