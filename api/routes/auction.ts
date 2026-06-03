import express, { type Request, type Response } from 'express';
import { db } from '../db.js';
import { addClient, broadcastNewBid, broadcastAuctionEnd } from '../sse.js';
import type { BidRecord, NewBidEventData, AuctionEndEventData } from '../../src/types/index.js';

const router = express.Router();

const generateId = (): string => Math.random().toString(36).substring(2, 15);

router.get('/auctions', (req: Request, res: Response) => {
  const auctions = Array.from(db.auctions.values());
  res.json({
    success: true,
    data: auctions,
  });
});

router.get('/auction/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const auction = db.auctions.get(id);
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
    });
  }
  
  auction.viewCount += 1;
  
  res.json({
    success: true,
    data: auction,
  });
});

router.get('/auction/:id/bids', (req: Request, res: Response) => {
  const { id } = req.params;
  const bids = db.bids.get(id) || [];
  
  res.json({
    success: true,
    data: bids,
  });
});

router.post('/auction/:id/bid', (req: Request, res: Response) => {
  const { id } = req.params;
  const { price, userId, userName, userAvatar } = req.body;
  
  const auction = db.auctions.get(id);
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
    });
  }
  
  if (Date.now() >= auction.endTime) {
    return res.status(400).json({
      success: false,
      error: 'Auction has ended',
    });
  }
  
  if (price <= auction.currentPrice) {
    return res.status(400).json({
      success: false,
      error: 'Bid must be higher than current price',
    });
  }
  
  const timestamp = Date.now();
  const bidRecord: BidRecord = {
    id: generateId(),
    auctionId: id,
    userId: userId || 'anonymous',
    userName: userName || '匿名用户',
    userAvatar: userAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous',
    price,
    timestamp,
  };
  
  const currentBids = db.bids.get(id) || [];
  currentBids.push(bidRecord);
  db.bids.set(id, currentBids);
  
  auction.currentPrice = price;
  auction.bidCount += 1;
  
  const bidEvent: NewBidEventData = {
    auctionId: id,
    price,
    userId: bidRecord.userId,
    userName: bidRecord.userName,
    userAvatar: bidRecord.userAvatar,
    timestamp,
  };
  
  broadcastNewBid(id, bidEvent);
  
  res.json({
    success: true,
    data: {
      price,
      timestamp,
    },
  });
});

router.post('/auction', (req: Request, res: Response) => {
  const { title, description, images, category, condition, startPrice, duration } = req.body;
  const now = Date.now();
  
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
  };
  
  db.auctions.set(auctionId, newAuction);
  db.bids.set(auctionId, []);
  
  res.json({
    success: true,
    data: newAuction,
  });
});

router.get('/time', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      timestamp: Date.now(),
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
  
  if (!auction) {
    return res.status(404).json({
      success: false,
      error: 'Auction not found',
    });
  }
  
  const bids = db.bids.get(id) || [];
  const highestBid = bids.length > 0 ? bids[bids.length - 1] : null;
  
  const endEvent: AuctionEndEventData = {
    auctionId: id,
    winnerId: highestBid?.userId || '',
    winnerName: highestBid?.userName || '流拍',
    finalPrice: highestBid?.price || auction.startPrice,
  };
  
  broadcastAuctionEnd(id, endEvent);
  
  res.json({
    success: true,
    data: endEvent,
  });
});

export default router;
