import { Link } from 'react-router-dom';
import { Gavel, Clock, Eye } from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import type { AuctionItem } from '../../../types';

interface AuctionCardProps {
  auction: AuctionItem;
  index?: number;
}

export const AuctionCard = ({ auction, index = 0 }: AuctionCardProps) => {
  const isEnded = Date.now() >= auction.endTime;
  const animationDelay = `${index * 100}ms`;

  return (
    <Link
      to={`/auction/${auction.id}`}
      className="glass-card-hover overflow-hidden group animate-fade-in-up"
      style={{ animationDelay }}
    >
      <div className="relative overflow-hidden">
        <img
          src={auction.images[0]}
          alt={auction.title}
          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent" />
        
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium rounded bg-dark-900/80 backdrop-blur-sm text-primary-400">
            {auction.category}
          </span>
        </div>
        
        {isEnded && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium rounded bg-red-500/20 backdrop-blur-sm text-red-400">
              已结束
            </span>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3">
          <CountdownTimer endTime={auction.endTime} showLabel={false} size="sm" />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-dark-100 mb-2 line-clamp-2 group-hover:text-primary-400 transition-colors">
          {auction.title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-dark-500 mb-3">
          <span className="px-2 py-0.5 bg-dark-700 rounded">{auction.condition}</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-dark-500 mb-1">当前价</div>
            <div className="text-xl font-bold text-primary-400 font-display">
              ¥{auction.currentPrice.toLocaleString()}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-dark-500">
            <div className="flex items-center gap-1">
              <Gavel size={12} />
              <span>{auction.bidCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{auction.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
