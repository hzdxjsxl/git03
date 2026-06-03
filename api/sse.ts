import type { Response } from 'express';
import type { NewBidEventData, AuctionEndEventData } from '../src/types/index.js';

interface Client {
  id: string;
  res: Response;
  auctionId?: string;
}

const clients = new Map<string, Client>();

const generateClientId = (): string => Math.random().toString(36).substring(2, 15);

export const addClient = (res: Response, auctionId?: string): string => {
  const clientId = generateClientId();
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  
  res.write('\n');
  
  clients.set(clientId, { id: clientId, res, auctionId });
  
  res.on('close', () => {
    clients.delete(clientId);
  });
  
  return clientId;
};

export const removeClient = (clientId: string): void => {
  clients.delete(clientId);
};

const sendEvent = (client: Client, event: string, data: unknown): void => {
  try {
    client.res.write(`event: ${event}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    removeClient(client.id);
  }
};

export const broadcastNewBid = (auctionId: string, bidData: NewBidEventData): void => {
  clients.forEach(client => {
    if (!client.auctionId || client.auctionId === auctionId) {
      sendEvent(client, 'new_bid', bidData);
    }
  });
};

export const broadcastAuctionEnd = (auctionId: string, endData: AuctionEndEventData): void => {
  clients.forEach(client => {
    if (!client.auctionId || client.auctionId === auctionId) {
      sendEvent(client, 'auction_end', endData);
    }
  });
};

export const getClientCount = (): number => clients.size;
