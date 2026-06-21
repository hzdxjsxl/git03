import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  vectorDimension: parseInt(process.env.VECTOR_DIMENSION || '128', 10),
  cache: {
    maxItems: parseInt(process.env.CACHE_MAX_ITEMS || '1000', 10),
    ttl: parseInt(process.env.CACHE_TTL || '300000', 10),
  },
  recommendation: {
    defaultLimit: 20,
    maxLimit: 50,
    minLimit: 5,
  },
};
