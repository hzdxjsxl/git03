import type { Response } from 'express';
import type { NewBidEventData, AuctionEndEventData } from '../src/types/index.js';

interface Client {
  id: string;
  res: Response;
  auctionId?: string;
  lastEventId?: string;
}

const clients = new Map<string, Client>();
const eventHistory = new Map<string, Array<{ id: string; event: string; data: unknown }>>();
const MAX_HISTORY_SIZE = 100;

const generateClientId = (): string => Math.random().toString(36).substring(2, 15);

const generateEventId = (): string => `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

const addToHistory = (auctionId: string, eventId: string, event: string, data: unknown) => {
  const history = eventHistory.get(auctionId) || [];
  history.push({ id: eventId, event, data });
  
  if (history.length > MAX_HISTORY_SIZE) {
    history.shift();
  }
  
  eventHistory.set(auctionId, history);
};

export const addClient = (res: Response, auctionId?: string): string => {
  const clientId = generateClientId();
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });
  
  res.write(`:ok\n\n`);
  
  clients.set(clientId, { id: clientId, res, auctionId });
  
  res.on('close', () => {
    clients.delete(clientId);
  });
  
  return clientId;
};

export const removeClient = (clientId: string): void => {
  clients.delete(clientId);
};

const sendEvent = (client: Client, eventId: string, event: string, data: unknown): void => {
  try {
    client.res.write(`id: ${eventId}\n`);
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    client.lastEventId = eventId;
  } catch (error) {
    console.error('Error sending SSE event:', error);
    removeClient(client.id);
  }
};

export const broadcastNewBid = (auctionId: string, bidData: NewBidEventData): void => {
  const eventId = generateEventId();
  
  addToHistory(auctionId, eventId, 'new_bid', bidData);
  
  clients.forEach(client => {
    if (!client.auctionId || client.auctionId === auctionId) {
      sendEvent(client, eventId, 'new_bid', bidData);
    }
  });
};

export const broadcastAuctionEnd = (auctionId: string, endData: AuctionEndEventData): void => {
  const eventId = generateEventId();
  
  addToHistory(auctionId, eventId, 'auction_end', endData);
  
  clients.forEach(client => {
    if (!client.auctionId || client.auctionId === auctionId) {
      sendEvent(client, eventId, 'auction_end', endData);
    }
  });
};

export const broadcastTimeSync = (serverTime: number): void => {
  const eventId = generateEventId();
  const data = { timestamp: serverTime };
  
  clients.forEach(client => {
    sendEvent(client, eventId, 'time_sync', data);
  });
};

export const getClientCount = (): number => clients.size;

export const getEventHistory = (auctionId: string, sinceId?: string) => {
  const history = eventHistory.get(auctionId) || [];
  
  if (!sinceId) {
    return history;
  }
  
  const index = history.findIndex(e => e.id === sinceId);
  return index >= 0 ? history.slice(index + 1) : history;
};

setInterval(() => {
  broadcastTimeSync(Date.now());
}, 10000);
