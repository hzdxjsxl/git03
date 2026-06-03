import { useState, useEffect } from 'react';
import { Gavel, TrendingUp, Users, Eye, Wifi, WifiOff } from 'lucide-react';
import { useAuctionStore } from '../store';
import { useMessageStore } from '../../message/store';
import { CountdownTimer } from './CountdownTimer';
import type { AuctionItem } from '../../../types';

interface BidPanelProps {
  auction: AuctionItem;
}

export const BidPanel = ({ auction }: BidPanelProps) => {
  const { currentAuction, placeBid, getAdjustedTime, pendingBids } = useAuctionStore();
  const addToast = useMessageStore((state) => state.addToast);
  
  const displayAuction = currentAuction?.id === auction.id ? currentAuction : auction;
  const [bidAmount, setBidAmount] = useState<number>(displayAuction.currentPrice + 100);
  const [isBidding, setIsBidding] = useState(false);
  
  const isEnded = getAdjustedTime() >= displayAuction.endTime;
  const quickBids = [100, 200, 500, 1000];
  const hasPendingBid = pendingBids.size > 0;

  useEffect(() => {
    setBidAmount((prev) => {
      const minBid = displayAuction.currentPrice + 100;
      return Math.max(prev, minBid);
    });
  }, [displayAuction.currentPrice]);

  const handleQuickBid = (increment: number) => {
    setBidAmount((prev) => Math.max(prev, displayAuction.currentPrice) + increment);
  };

  const handlePlaceBid = async () => {
    if (bidAmount <= displayAuction.currentPrice) {
      addToast({
        type: 'error',
        title: '出价失败',
        message: `出价必须高于当前价格 ¥${displayAuction.currentPrice.toLocaleString()}`,
      });
      return;
    }

    if (getAdjustedTime() >= displayAuction.endTime) {
      addToast({
        type: 'error',
        title: '出价失败',
        message: '拍卖已结束',
      });
      return;
    }

    if (hasPendingBid) {
      addToast({
        type: 'warning',
        title: '请稍候',
        message: '您的出价正在处理中...',
      });
      return;
    }

    setIsBidding(true);
    const success = await placeBid(auction.id, bidAmount);
    setIsBidding(false);

    if (success) {
      setBidAmount(bidAmount + 100);
    }
  };

  const minBid = displayAuction.currentPrice + 1;

  return (
    <div className="glass-card p-6 sticky top-4">
      <div className="mb-6">
        <CountdownTimer endTime={displayAuction.endTime} size="lg" />
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm text-dark-400">当前最高价</span>
          <TrendingUp size={16} className="text-primary-400" />
          {hasPendingBid && (
            <span className="flex items-center gap-1 text-xs text-accent-400 animate-pulse">
              <Wifi size={12} />
              出价处理中
            </span>
          )}
        </div>
        <div className="text-4xl font-bold font-display text-primary-400">
          ¥{displayAuction.currentPrice.toLocaleString()}
        </div>
        <div className="text-sm text-dark-500 mt-1">
          起拍价 ¥{displayAuction.startPrice.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-dark-400">
          <Gavel size={16} />
          <span className="text-sm">{displayAuction.bidCount} 次出价</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <Eye size={16} />
          <span className="text-sm">{displayAuction.viewCount} 次浏览</span>
        </div>
      </div>

      {!isEnded && (
        <>
          <div className="mb-4">
            <label className="block text-sm text-dark-400 mb-2">
              我的出价 <span className="text-dark-600">(最低 ¥{minBid.toLocaleString()})</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">¥</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="input-field pl-8 text-lg font-semibold"
                min={minBid}
                disabled={isBidding || hasPendingBid}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {quickBids.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickBid(amount)}
                disabled={isBidding || hasPendingBid}
                className="py-2 text-sm font-medium rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-primary-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +{amount}
              </button>
            ))}
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={isBidding || bidAmount <= displayAuction.currentPrice || hasPendingBid}
            className="w-full btn-accent flex items-center justify-center gap-2"
          >
            <Gavel size={20} />
            {isBidding ? '出价中...' : '立即出价'}
          </button>
        </>
      )}

      {isEnded && (
        <div className="text-center py-4 bg-dark-700/50 rounded-lg">
          <Users size={24} className="mx-auto mb-2 text-dark-500" />
          <p className="text-dark-400">拍卖已结束</p>
          <p className="text-sm text-dark-500 mt-1">
            共 {displayAuction.bidCount} 次出价
          </p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <img
            src={displayAuction.sellerAvatar}
            alt={displayAuction.sellerName}
            className="w-10 h-10 rounded-full bg-dark-700"
          />
          <div>
            <div className="font-medium text-dark-200">{displayAuction.sellerName}</div>
            <div className="text-xs text-dark-500">卖家</div>
          </div>
        </div>
      </div>
    </div>
  );
};
