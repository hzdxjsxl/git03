import express, { type Request, type Response } from 'express';
import { db } from '../db.js';
import { broadcastNewBid, broadcastAuctionEnd } from '../sse.js';
import type {
  BidRecord,
  NewBidEventData,
  AuctionEndEventData,
  PlaceBidInput,
} from '../../src/types/index.js';

const router = express.Router();

const generateId = (): string => Math.random().toString(36).substring(2, 15);
const generateRequestId = (): string => `req_${Date.now()}_${generateId()}`;

interface BidDebounceEntry {
  timestamp: number;
  price: number;
}

const userBidDebounce = new Map<string, BidDebounceEntry>();
const processedTransactions = new Map<string, BidRecord>();
const auctionSequenceCounters = new Map<string, number>();
const DEBOUNCE_WINDOW_MS = 500;
const TRANSACTION_EXPIRY_MS = 3600000;

setInterval(() => {
  const now = Date.now();
  processedTransactions.forEach((record, txId) => {
    if (now - record.timestamp > TRANSACTION_EXPIRY_MS) {
      processedTransactions.delete(txId);
    }
  });
}, 60000);

const getNextSequence = (auctionId: string): number => {
  const current = auctionSequenceCounters.get(auctionId) || 0;
  const next = current + 1;
  auctionSequenceCounters.set(auctionId, next);
  return next;
};

const setSequence = (auctionId: string, sequence: number): void => {
  auctionSequenceCounters.set(auctionId, sequence);
};

const isValidNonce = (userId: string, nonce: string): boolean => {
  const key = `${userId}_${nonce}`;
  const now = Date.now();
  const existing = userBidDebounce.get(key);
  
  if (existing && now - existing.timestamp < DEBOUNCE_WINDOW_MS) {
    return false;
  }
  
  userBidDebounce.set(key, { timestamp: now, price: 0 });
  return true;
};

router.get('/auctions', (req: Request, res: Response) => {
  const auctions = Array.from(db.auctions.values()).map(a => ({
    ...a,
    lastBidSequence: auctionSequenceCounters.get(a.id) || 0,
  }));
  res.json({
    success: true,
    data: auctions,
    requestId: generateRequestId(),
  });
});

router.get('/auction/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const auction = db.auctions.get(id);
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
      requestId: generateRequestId(),
    });
  }
  
  auction.viewCount += 1;
  
  res.json({
    success: true,
    data: {
      ...auction,
      lastBidSequence: auctionSequenceCounters.get(id) || 0,
    },
    requestId: generateRequestId(),
  });
});

router.get('/auction/:id/bids', (req: Request, res: Response) => {
  const { id } = req.params;
  const bids = db.bids.get(id) || [];
  
  if (bids.length > 0) {
    const maxSequence = Math.max(...bids.map(b => b.sequence || 0));
    setSequence(id, maxSequence);
  }
  
  res.json({
    success: true,
    data: bids,
    requestId: generateRequestId(),
  });
});

router.post('/auction/:id/bid', (req: Request, res: Response) => {
  const { id } = req.params;
  const { price, userId, userName, userAvatar, transactionId, nonce } = req.body as PlaceBidInput;
  
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  if (!transactionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing transactionId',
      requestId,
    });
  }
  
  const existingBid = processedTransactions.get(transactionId);
  if (existingBid) {
    return res.json({
      success: true,
      data: {
        bidId: existingBid.id,
        price: existingBid.price,
        timestamp: existingBid.timestamp,
        transactionId: existingBid.transactionId,
        sequence: existingBid.sequence,
      },
      requestId,
      note: 'Duplicate request - returning existing result',
    });
  }
  
  if (!nonce || !isValidNonce(userId, nonce)) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests - please wait before bidding again',
      requestId,
    });
  }
  
  const auction = db.auctions.get(id);
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
      requestId,
    });
  }
  
  const serverNow = Date.now();
  if (serverNow >= auction.endTime) {
    return res.status(400).json({
      success: false,
      error: 'Auction has ended',
      requestId,
    });
  }
  
  if (price <= auction.currentPrice) {
    return res.status(400).json({
      success: false,
      error: `Bid must be higher than current price of ${auction.currentPrice}`,
      requestId,
    });
  }
  
  const timestamp = Date.now();
  const sequence = getNextSequence(id);
  const bidId = `bid_${id}_${sequence}_${generateId()}`;
  
  const bidRecord: BidRecord = {
    id: bidId,
    auctionId: id,
    userId: userId || 'anonymous',
    userName: userName || '匿名用户',
    userAvatar: userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    price,
    timestamp,
    transactionId,
    sequence,
  };
  
  const currentBids = db.bids.get(id) || [];
  currentBids.push(bidRecord);
  db.bids.set(id, currentBids);
  
  auction.currentPrice = price;
  auction.bidCount += 1;
  auction.lastBidSequence = sequence;
  
  processedTransactions.set(transactionId, bidRecord);
  
  const bidEvent: NewBidEventData = {
    auctionId: id,
    bidId,
    price,
    userId: bidRecord.userId,
    userName: bidRecord.userName,
    userAvatar: bidRecord.userAvatar,
    timestamp,
    transactionId,
    sequence,
  };
  
  setImmediate(() => {
    broadcastNewBid(id, bidEvent);
  });
  
  const latency = Date.now() - startTime;
  
  res.json({
    success: true,
    data: {
      bidId,
      price,
      timestamp,
      transactionId,
      sequence,
    },
    latency,
    serverTimestamp: timestamp,
    requestId,
  });
});

router.post('/auction', (req: Request, res: Response) => {
  const { title, description, images, category, condition, startPrice, duration } = req.body;
  const now = Date.now();
  const requestId = generateRequestId();
  
  const auctionId = generateId();
  const newAuction = {
    id: auctionId,
    title,
    description,
    images: images || [],
    category: category || '其他',
    condition: condition || '未知',
    startPrice,
    currentPrice: startPrice,
    startTime: now,
    endTime: now + duration * 60 * 1000,
    sellerId: 'demo-user',
    sellerName: '演示用户',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    bidCount: 0,
    viewCount: 0,
    lastBidSequence: 0,
  };
  
  db.auctions.set(auctionId, newAuction);
  db.bids.set(auctionId, []);
  auctionSequenceCounters.set(auctionId, 0);
  
  res.json({
    success: true,
    data: newAuction,
    requestId,
  });
});

router.get('/time', (req: Request, res: Response) => {
  const requestId = generateRequestId();
  const serverTime = Date.now();
  
  res.json({
    success: true,
    data: {
      timestamp: serverTime,
      serverTime,
      requestId,
    },
  });
});

router.post('/time/sync', (req: Request, res: Response) => {
  const { clientSendTime, requestId: clientRequestId } = req.body;
  const serverReceiveTime = Date.now();
  const requestId = clientRequestId || generateRequestId();
  
  res.json({
    success: true,
    data: {
      clientSendTime,
      serverReceiveTime,
      serverSendTime: Date.now(),
      requestId,
    },
  });
});

router.get('/stream', (req: Request, res: Response) => {
  const { auctionId } = req.query;
  addClient(res, auctionId as string);
});

router.post('/auction/:id/end', (req: Request, res: Response) => {
  const { id } = req.params;
  const auction = db.auctions.get(id);
  const requestId = generateRequestId();
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
      requestId,
    });
  }
  
  const bids = db.bids.get(id) || [];
  const highestBid = bids.length > 0 ? bids[bids.length - 1] : null;
  
  const endEvent: AuctionEndEventData = {
    auctionId: id,
    winnerId: highestBid?.userId || '',
    winnerName: highestBid?.userName || '流拍',
    finalPrice: highestBid?.price || auction.startPrice,
    lastSequence: auctionSequenceCounters.get(id) || 0,
  };
  
  broadcastAuctionEnd(id, endEvent);
  
  res.json({
    success: true,
    data: endEvent,
    requestId,
  });
});

import { addClient } from '../sse.js';

export default router;
