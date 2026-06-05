export interface Player {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  position: 'top' | 'jungle' | 'mid' | 'adc' | 'support';
  positionName: string;
  avatar: string;
}

export interface MatchRecord {
  id: string;
  matchId: string;
  matchDate: string;
  matchNumber: number;
  playerId: string;
  kills: number;
  deaths: number;
  assists: number;
  survivalTime: number;
  distance: number;
  gold: number;
  damage: number;
  visionScore: number;
  crowdControl: number;
  cs: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamName: string;
  teamColor: string;
  position: string;
  positionName: string;
  avatar: string;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgSurvivalTime: number;
  avgDistance: number;
  avgGold: number;
  avgDamage: number;
  avgVisionScore: number;
  avgCrowdControl: number;
  kda: number;
  totalMatches: number;
}

export interface NormalizedStats {
  killScore: number;
  survivalScore: number;
  assistScore: number;
  goldScore: number;
  damageScore: number;
  visionScore: number;
  ccScore: number;
  overallScore: number;
}

export interface RadarData {
  name: string;
  value: number[];
  color: string;
}

export interface ScatterData {
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  team: string;
}

export interface TrendData {
  matchNumber: number;
  matchDate: string;
  [key: string]: number | string;
}
