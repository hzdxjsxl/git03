import type { AuctionItem, BidRecord, User } from '../src/types/index.js';

const generateId = (): string => Math.random().toString(36).substring(2, 15);

const now = Date.now();
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export const db = {
  auctions: new Map<string, AuctionItem>(),
  bids: new Map<string, BidRecord[]>(),
  users: new Map<string, User>(),
};

const sampleUsers: User[] = [
  { id: 'user-1', name: '张小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', phone: '13800138001' },
  { id: 'user-2', name: '李小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', phone: '13800138002' },
  { id: 'user-3', name: '王大伟', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', phone: '13800138003' },
  { id: 'user-4', name: '赵芳芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', phone: '13800138004' },
  { id: 'user-5', name: '陈志强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike', phone: '13800138005' },
];

sampleUsers.forEach(user => db.users.set(user.id, user));

const sampleAuctions: AuctionItem[] = [
  {
    id: 'auction-1',
    title: 'iPhone 15 Pro Max 256GB 深空黑色',
    description: '自用 iPhone 15 Pro Max，99新，电池健康度98%，在保至2026年3月，无磕碰划痕，配件齐全',
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d64fb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop',
    ],
    category: '数码产品',
    condition: '99新',
    startPrice: 5000,
    currentPrice: 6800,
    startTime: now - 2 * ONE_HOUR,
    endTime: now + 45 * 60 * 1000,
    sellerId: 'user-1',
    sellerName: '张小明',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    bidCount: 12,
    viewCount: 256,
  },
  {
    id: 'auction-2',
    title: 'Sony WH-1000XM5 无线降噪头戴耳机',
    description: 'Sony旗舰降噪耳机，使用仅3个月，音质完美，降噪效果出色，配件齐全包装完好',
    images: [
      'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&h=600&fit=crop',
    ],
    category: '数码产品',
    condition: '95新',
    startPrice: 1500,
    currentPrice: 2100,
    startTime: now - 5 * ONE_HOUR,
    endTime: now + 2 * ONE_HOUR,
    sellerId: 'user-2',
    sellerName: '李小红',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    bidCount: 8,
    viewCount: 134,
  },
  {
    id: 'auction-3',
    title: 'MacBook Pro 14英寸 M3 Pro 银色',
    description: '2023款 MacBook Pro 14寸，M3 Pro芯片，18GB内存，512GB存储，循环次数仅47次',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689094219?w=800&h=600&fit=crop',
    ],
    category: '电脑办公',
    condition: '99新',
    startPrice: 12000,
    currentPrice: 14500,
    startTime: now - 1 * ONE_DAY,
    endTime: now + 5 * ONE_HOUR,
    sellerId: 'user-3',
    sellerName: '王大伟',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    bidCount: 15,
    viewCount: 423,
  },
  {
    id: 'auction-4',
    title: 'Nike Dunk Low 熊猫配色 42码',
    description: '经典熊猫配色，穿着次数个位数，鞋底几乎无磨损，鞋盒完好',
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=600&fit=crop',
    ],
    category: '服饰鞋包',
    condition: '95新',
    startPrice: 800,
    currentPrice: 1150,
    startTime: now - 3 * ONE_HOUR,
    endTime: now + 30 * 60 * 1000,
    sellerId: 'user-4',
    sellerName: '赵芳芳',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bidCount: 6,
    viewCount: 89,
  },
  {
    id: 'auction-5',
    title: '戴森 V15 Detect 无线吸尘器',
    description: '戴森旗舰款吸尘器，激光探测灰尘，使用半年，所有吸头配件齐全',
    images: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&h=600&fit=crop',
    ],
    category: '家用电器',
    condition: '9成新',
    startPrice: 3000,
    currentPrice: 3800,
    startTime: now - 6 * ONE_HOUR,
    endTime: now + 8 * ONE_HOUR,
    sellerId: 'user-5',
    sellerName: '陈志强',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
    bidCount: 5,
    viewCount: 167,
  },
  {
    id: 'auction-6',
    title: 'iPad Air 5 256GB 深空灰 WiFi版',
    description: 'iPad Air第五代，M1芯片，性能强劲，适合办公娱乐，配件齐全',
    images: [
      'https://images.unsplash.com/photo-1544244015-86d5f61c1572?w=800&h=600&fit=crop',
    ],
    category: '数码产品',
    condition: '95新',
    startPrice: 3500,
    currentPrice: 4200,
    startTime: now - 12 * ONE_HOUR,
    endTime: now + 12 * ONE_HOUR,
    sellerId: 'user-1',
    sellerName: '张小明',
    sellerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    bidCount: 9,
    viewCount: 198,
  },
];

sampleAuctions.forEach(auction => {
  auction.lastBidSequence = 0;
  db.auctions.set(auction.id, auction);
  
  const bidHistory: BidRecord[] = [];
  const bidCount = Math.floor(Math.random() * 8) + 3;
  let currentPrice = auction.startPrice;
  
  for (let i = 0; i < bidCount; i++) {
    const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
    const increment = Math.floor(Math.random() * 500) + 100;
    currentPrice += increment;
    const sequence = i + 1;
    
    bidHistory.push({
      id: `bid_${auction.id}_${sequence}_${generateId()}`,
      auctionId: auction.id,
      userId: randomUser.id,
      userName: randomUser.name,
      userAvatar: randomUser.avatar,
      price: currentPrice,
      timestamp: auction.startTime + Math.random() * (Date.now() - auction.startTime) * (i + 1) / bidCount,
      transactionId: `tx_${auction.id}_${sequence}_${generateId()}`,
      sequence,
    });
    
    auction.lastBidSequence = sequence;
  }
  
  bidHistory.sort((a, b) => a.timestamp - b.timestamp);
  db.bids.set(auction.id, bidHistory);
});

export const getDbStats = () => ({
  auctions: db.auctions.size,
  users: db.users.size,
  totalBids: Array.from(db.bids.values()).reduce((sum, bids) => sum + bids.length, 0),
});
