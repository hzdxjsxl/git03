import { Player, MatchRecord, PlayerStats, NormalizedStats, RadarData, ScatterData, TrendData } from '../types';

export function cleanData(matches: MatchRecord[]): MatchRecord[] {
  if (!matches || matches.length === 0) return [];
  return matches.map(match => ({
    ...match,
    kills: Math.max(0, match.kills || 0),
    deaths: Math.max(1, match.deaths || 1),
    assists: Math.max(0, match.assists || 0),
    survivalTime: Math.max(0, match.survivalTime || 0),
    distance: Math.max(0, match.distance || 0),
    gold: Math.max(0, match.gold || 0),
    damage: Math.max(0, match.damage || 0),
    visionScore: Math.max(0, match.visionScore || 0),
    crowdControl: Math.max(0, match.crowdControl || 0),
    cs: Math.max(0, match.cs || 0),
  }));
}

export function aggregatePlayerStats(
  players: Player[],
  matches: MatchRecord[]
): PlayerStats[] {
  if (!players || players.length === 0) return [];
  const cleanedMatches = cleanData(matches);
  
  return players.map(player => {
    const playerMatches = cleanedMatches.filter(m => m.playerId === player.id);
    
    if (playerMatches.length === 0) {
      return {
        playerId: player.id,
        playerName: player.name,
        teamName: player.teamName,
        teamColor: player.teamColor,
        position: player.position,
        positionName: player.positionName,
        avatar: player.avatar,
        avgKills: 0,
        avgDeaths: 0,
        avgAssists: 0,
        avgSurvivalTime: 0,
        avgDistance: 0,
        avgGold: 0,
        avgDamage: 0,
        avgVisionScore: 0,
        avgCrowdControl: 0,
        kda: 0,
        totalMatches: 0,
      };
    }

    const totalKills = sum(playerMatches, 'kills');
    const totalDeaths = sum(playerMatches, 'deaths');
    const totalAssists = sum(playerMatches, 'assists');
    
    return {
      playerId: player.id,
      playerName: player.name,
      teamName: player.teamName,
      teamColor: player.teamColor,
      position: player.position,
      positionName: player.positionName,
      avatar: player.avatar,
      avgKills: avg(playerMatches, 'kills'),
      avgDeaths: avg(playerMatches, 'deaths'),
      avgAssists: avg(playerMatches, 'assists'),
      avgSurvivalTime: avg(playerMatches, 'survivalTime'),
      avgDistance: avg(playerMatches, 'distance'),
      avgGold: avg(playerMatches, 'gold'),
      avgDamage: avg(playerMatches, 'damage'),
      avgVisionScore: avg(playerMatches, 'visionScore'),
      avgCrowdControl: avg(playerMatches, 'crowdControl'),
      kda: totalDeaths === 0 ? totalKills + totalAssists : (totalKills + totalAssists) / totalDeaths,
      totalMatches: playerMatches.length,
    };
  });
}

export function normalizeStats(playerStats: PlayerStats[]): Map<string, NormalizedStats> {
  const result = new Map<string, NormalizedStats>();
  
  if (!playerStats || playerStats.length === 0) return result;

  const maxKills = Math.max(...playerStats.map(p => p.avgKills));
  const maxSurvival = Math.max(...playerStats.map(p => p.avgSurvivalTime));
  const maxAssists = Math.max(...playerStats.map(p => p.avgAssists));
  const maxGold = Math.max(...playerStats.map(p => p.avgGold));
  const maxDamage = Math.max(...playerStats.map(p => p.avgDamage));
  const maxVision = Math.max(...playerStats.map(p => p.avgVisionScore));
  const maxCC = Math.max(...playerStats.map(p => p.avgCrowdControl));

  playerStats.forEach(stats => {
    const killScore = normalizeValue(stats.avgKills, maxKills);
    const survivalScore = normalizeValue(stats.avgSurvivalTime, maxSurvival);
    const assistScore = normalizeValue(stats.avgAssists, maxAssists);
    const goldScore = normalizeValue(stats.avgGold, maxGold);
    const damageScore = normalizeValue(stats.avgDamage, maxDamage);
    const visionScore = normalizeValue(stats.avgVisionScore, maxVision);
    const ccScore = normalizeValue(stats.avgCrowdControl, maxCC);

    result.set(stats.playerId, {
      killScore,
      survivalScore,
      assistScore,
      goldScore,
      damageScore,
      visionScore,
      ccScore,
      overallScore: (killScore + survivalScore + assistScore + goldScore + damageScore + visionScore + ccScore) / 7,
    });
  });

  return result;
}

export function generateRadarData(
  playerStats: PlayerStats[],
  normalizedStats: Map<string, NormalizedStats>
): RadarData[] {
  if (!playerStats || playerStats.length === 0) return [];
  return playerStats.map(stats => {
    const normalized = normalizedStats.get(stats.playerId);
    return {
      name: stats.playerName,
      value: normalized ? [
        normalized.killScore,
        normalized.survivalScore,
        normalized.assistScore,
        normalized.goldScore,
        normalized.damageScore,
        normalized.visionScore,
      ] : [0, 0, 0, 0, 0, 0],
      color: stats.teamColor,
    };
  });
}

export function generateScatterData(
  playerStats: PlayerStats[],
  xField: keyof PlayerStats = 'avgKills',
  yField: keyof PlayerStats = 'avgDeaths',
  sizeField: keyof PlayerStats = 'avgDamage'
): ScatterData[] {
  if (!playerStats || playerStats.length === 0) return [];
  const maxSize = Math.max(...playerStats.map(p => p[sizeField] as number));
  
  return playerStats.map(stats => {
    const sizeRatio = maxSize === 0 ? 0 : (stats[sizeField] as number) / maxSize;
    return {
      name: stats.playerName,
      x: stats[xField] as number,
      y: stats[yField] as number,
      size: sizeRatio * 40 + 15,
      color: stats.teamColor,
      team: stats.teamName,
    };
  });
}

export function generateTrendData(
  playerId: string,
  matches: MatchRecord[],
  fields: (keyof MatchRecord)[] = ['kills', 'deaths', 'assists']
): TrendData[] {
  if (!matches || matches.length === 0) return [];
  const playerMatches = matches
    .filter(m => m.playerId === playerId)
    .sort((a, b) => a.matchNumber - b.matchNumber);

  return playerMatches.map(match => {
    const result: TrendData = {
      matchNumber: match.matchNumber,
      matchDate: match.matchDate,
    };
    fields.forEach(field => {
      result[field] = match[field] as number;
    });
    return result;
  });
}

export function filterByPosition(
  playerStats: PlayerStats[],
  position: string | null
): PlayerStats[] {
  if (!playerStats) return [];
  if (!position || position === 'all') return playerStats;
  return playerStats.filter(p => p.position === position);
}

export function filterByTeam(
  playerStats: PlayerStats[],
  teamId: string | null
): PlayerStats[] {
  if (!playerStats) return [];
  if (!teamId || teamId === 'all') return playerStats;
  return playerStats.filter(p => p.teamName === teamId);
}

export function sortPlayers(
  playerStats: PlayerStats[],
  sortBy: keyof PlayerStats = 'kda',
  ascending: boolean = false
): PlayerStats[] {
  if (!playerStats) return [];
  return [...playerStats].sort((a, b) => {
    const aVal = a[sortBy] as number;
    const bVal = b[sortBy] as number;
    return ascending ? aVal - bVal : bVal - aVal;
  });
}

function sum(matches: MatchRecord[], field: keyof MatchRecord): number {
  return matches.reduce((acc, m) => acc + (m[field] as number), 0);
}

function avg(matches: MatchRecord[], field: keyof MatchRecord): number {
  if (matches.length === 0) return 0;
  return parseFloat((sum(matches, field) / matches.length).toFixed(2));
}

function normalizeValue(value: number, max: number): number {
  if (max === 0) return 0;
  return parseFloat(((value / max) * 100).toFixed(1));
}

export const RADAR_INDICATORS = [
  { name: '击杀', max: 100 },
  { name: '生存', max: 100 },
  { name: '支援', max: 100 },
  { name: '经济', max: 100 },
  { name: '输出', max: 100 },
  { name: '视野', max: 100 },
];

export const FIELD_LABELS: Record<string, string> = {
  avgKills: '场均击杀',
  avgDeaths: '场均死亡',
  avgAssists: '场均助攻',
  kda: 'KDA',
  avgSurvivalTime: '生存时间(秒)',
  avgDistance: '跑动距离',
  avgGold: '场均经济',
  avgDamage: '场均输出',
  avgVisionScore: '视野得分',
  avgCrowdControl: '控制时长',
  kills: '击杀',
  deaths: '死亡',
  assists: '助攻',
  gold: '经济',
  damage: '输出',
};
