export interface Point {
  x: number;
  y: number;
  id?: string;
  timestamp?: number;
}

export interface Cluster {
  centroid: Point;
  count: number;
  label: number;
  color: string;
}

export interface WSMessage {
  type: 'data' | 'config' | 'status';
  payload: Point[] | ServerConfig;
}

export interface ServerConfig {
  numClusters: number;
  pushRate: number;
  pointsPerPush: number;
}

export const CLUSTER_COLORS = [
  '#00f5ff',
  '#ff00ff',
  '#ffff00',
  '#00ff88',
  '#ff6b6b',
  '#4ecdc4',
  '#ffe66d',
  '#95e1d3',
];
