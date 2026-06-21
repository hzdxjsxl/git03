import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║                                                           ║
  ║   🚀 API Gateway Server Started                           ║
  ║                                                           ║
  ║   Port:      ${config.port.toString().padEnd(41)}║
  ║   Env:       ${config.nodeEnv.padEnd(41)}║
  ║   Target:    ${config.recommendationServiceUrl.padEnd(41)}║
  ║                                                           ║
  ║   Health:    http://localhost:${config.port}/health           ║
  ║                                                           ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

const gracefulShutdown = (signal: string) => {
  console.log(`\nReceived ${signal}, starting graceful shutdown...`);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
