/**
 * local server entry file, for local development
 */
import { WebSocketServer } from 'ws';
import http from 'http';
import app from './app.js';
import { DataGenerator } from './dataGenerator.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const dataGenerator = new DataGenerator(4);
const pushRate = 50;
const pointsPerPush = 10;

wss.on('connection', (ws) => {
  console.log('Client connected');

  const interval = setInterval(() => {
    if (ws.readyState === 1) {
      const points = dataGenerator.generatePoints(pointsPerPush);
      ws.send(JSON.stringify({
        type: 'data',
        payload: points,
      }));
    }
  }, pushRate);

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'config' && message.payload) {
        if (message.payload.numClusters) {
          dataGenerator.setNumClusters(message.payload.numClusters);
        }
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  wss.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
