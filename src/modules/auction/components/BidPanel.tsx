import { useState } from 'react';
import { Gavel, TrendingUp, Users, Eye } from 'lucide-react';
import { useAuctionStore } from '../store';
import { useMessageStore } from '../../message/store';
import { CountdownTimer } from './CountdownTimer';
import type { AuctionItem } from '../../../types';

interface BidPanelProps {
  auction: AuctionItem;
}

export const BidPanel = ({ auction }: BidPanelProps) => {
  const [bidAmount, setBidAmount] = useState<number>(auction.currentPrice + 100);
  const [isBidding, setIsBidding] = useState(false);
  const placeBid = useAuctionStore((state) => state.placeBid);
  const addToast = useMessageStore((state) => state.addToast);

  const isEnded = Date.now() >= auction.endTime;
  const quickBids = [100, 200, 500, 1000];

  const handleQuickBid = (increment: number) => {
    setBidAmount((prev) => Math.max(prev, auction.currentPrice) + increment);
  };

  const handlePlaceBid = async () => {
    if (bidAmount <= auction.currentPrice) {
      addToast({
        type: 'error',
        title: '出价失败',
        message: '出价必须高于当前价格',
      });
      return;
    }

    setIsBidding(true);
    const success = await placeBid(auction.id, bidAmount);
    setIsBidding(false);

    if (success) {
      addToast({
        type: 'success',
        title: '出价成功！',
        message: `您已出价 ¥${bidAmount.toLocaleString()}`,
      });
      setBidAmount(bidAmount + 100);
    } else {
      addToast({
        type: 'error',
        title: '出价失败',
        message: '请稍后重试',
      });
    }
  };

  return (
    <div className="glass-card p-6 sticky top-4">
      <div className="mb-6">
        <CountdownTimer endTime={auction.endTime} size="lg" />
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-sm text-dark-400">当前最高价</span>
          <TrendingUp size={16} className="text-primary-400" />
        </div>
        <div className="text-4xl font-bold font-display text-primary-400">
          ¥{auction.currentPrice.toLocaleString()}
        </div>
        <div className="text-sm text-dark-500 mt-1">
          起拍价 ¥{auction.startPrice.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-dark-400">
          <Gavel size={16} />
          <span className="text-sm">{auction.bidCount} 次出价</span>
        </div>
        <div className="flex items-center gap-2 text-dark-400">
          <Eye size={16} />
          <span className="text-sm">{auction.viewCount} 次浏览</span>
        </div>
      </div>

      {!isEnded && (
        <>
          <div className="mb-4">
            <label className="block text-sm text-dark-400 mb-2">我的出价</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">¥</span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                className="input-field pl-8 text-lg font-semibold"
                min={auction.currentPrice + 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {quickBids.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuickBid(amount)}
                className="py-2 text-sm font-medium rounded-lg bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-primary-400 transition-all duration-200"
              >
                +{amount}
              </button>
            ))}
          </div>

          <button
            onClick={handlePlaceBid}
            disabled={isBidding || bidAmount <= auction.currentPrice}
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
            共 {auction.bidCount} 次出价
          </p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <img
            src={auction.sellerAvatar}
            alt={auction.sellerName}
            className="w-10 h-10 rounded-full bg-dark-700"
          />
          <div>
            <div className="font-medium text-dark-200">{auction.sellerName}</div>
            <div className="text-xs text-dark-500">卖家</div>
          </div>
        </div>
      </div>
    </div>
  );
};
