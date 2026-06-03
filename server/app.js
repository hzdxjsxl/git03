const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const config = require('./config');
const routes = require('./routes');
const { registerBattleHandlers } = require('./controllers/battleSocketHandler');
const { initialize } = require('./models/database');

async function start() {
  await initialize();
  console.log('[DB] Database ready');

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', routes);

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  io.on('connection', (socket) => {
    registerBattleHandlers(io, socket);
  });

  server.listen(config.PORT, () => {
    console.log(`[Server] Card Battle Game running at http://localhost:${config.PORT}`);
  });

  process.on('SIGINT', () => {
    const { forceSave } = require('./models/database').getDb();
    forceSave();
    console.log('[Server] Database saved, shutting down');
    process.exit(0);
  });
}

start().catch(err => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
