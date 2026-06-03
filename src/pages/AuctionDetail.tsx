import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Tag, FileText } from 'lucide-react';
import { useAuctionStore } from '../modules/auction/store';
import { useSSE } from '../modules/message/hooks/useSSE';
import { BidPanel } from '../modules/auction/components/BidPanel';
import { PriceChart } from '../modules/auction/components/PriceChart';
import type { BidRecord } from '../types';

export const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentAuction, bidHistory, fetchAuctionDetail, fetchBidHistory, isLoading } = useAuctionStore();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useSSE({ auctionId: id, enabled: true });

  useEffect(() => {
    if (id) {
      fetchAuctionDetail(id);
      fetchBidHistory(id);
    }
  }, [id, fetchAuctionDetail, fetchBidHistory]);

  if (isLoading || !currentAuction) {
    return (
      <div className="container py-12">
        <div className="animate-pulse">
          <div className="h-6 w-24 bg-dark-700 rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-dark-800 rounded-xl" />
              <div className="h-8 bg-dark-800 rounded w-1/2" />
              <div className="h-32 bg-dark-800 rounded" />
            </div>
            <div className="h-96 bg-dark-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % currentAuction.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + currentAuction.images.length) % currentAuction.images.length);
  };

  const sortedBids = [...bidHistory].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="container py-8">
      <Link to="/" className="inline-flex items-center gap-2 text-dark-400 hover:text-primary-400 transition-colors mb-8">
        <ArrowLeft size={20} />
        <span>返回列表</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden">
            <div className="relative aspect-video">
              <img
                src={currentAuction.images[currentImageIndex]}
                alt={currentAuction.title}
                className="w-full h-full object-cover"
              />
              
              {currentAuction.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-dark-900/80 text-white hover:bg-dark-800 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-dark-900/80 text-white hover:bg-dark-800 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {currentAuction.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-primary-400' : 'bg-dark-500'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h1 className="text-2xl font-bold text-dark-100 mb-4 font-display">
              {currentAuction.title}
            </h1>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/20 text-primary-400 text-sm">
                <Tag size={14} />
                {currentAuction.category}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-700 text-dark-300 text-sm">
                <Package size={14} />
                {currentAuction.condition}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-dark-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-medium text-dark-200 mb-2">商品描述</h3>
                  <p className="text-dark-400 leading-relaxed">
                    {currentAuction.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <PriceChart bids={bidHistory} height={220} />

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-dark-100 mb-4">出价记录</h3>
            
            {sortedBids.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {sortedBids.map((bid: BidRecord) => (
                  <div
                    key={bid.id}
                    className="flex items-center justify-between py-3 border-b border-dark-700/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={bid.userAvatar}
                        alt={bid.userName}
                        className="w-8 h-8 rounded-full bg-dark-700"
                      />
                      <div>
                        <div className="font-medium text-dark-200">{bid.userName}</div>
                        <div className="text-xs text-dark-500">
                          {new Date(bid.timestamp).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary-400">
                      ¥{bid.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dark-500 text-center py-8">暂无出价记录</p>
            )}
          </div>
        </div>

        <div>
          <BidPanel auction={currentAuction} />
        </div>
      </div>
    </div>
  );
};
