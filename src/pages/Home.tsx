import { useEffect, useState } from 'react';
import { Search, Filter, Flame, Clock, Zap } from 'lucide-react';
import { useAuctionStore } from '../modules/auction/store';
import { AuctionCard } from '../modules/auction/components/AuctionCard';
import { useSSE } from '../modules/message/hooks/useSSE';

const categories = ['全部', '数码产品', '电脑办公', '家用电器', '服饰鞋包', '家居生活'];

export const Home = () => {
  const { auctions, fetchAuctions, isLoading } = useAuctionStore();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');

  useSSE({ enabled: true });

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const filteredAuctions = auctions.filter((auction) => {
    const matchCategory = activeCategory === '全部' || auction.category === activeCategory;
    const matchSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const activeAuctions = filteredAuctions.filter((a) => Date.now() < a.endTime);
  const endingSoon = activeAuctions.filter((a) => {
    const remaining = a.endTime - Date.now();
    return remaining > 0 && remaining < 60 * 60 * 1000;
  });

  return (
    <div className="min-h-screen">
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold font-display mb-4 bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              发现宝藏，竞你所爱
            </h1>
            <p className="text-dark-400 text-lg mb-8">
              海量优质二手商品，透明竞价，公平交易
            </p>
            
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" size={20} />
              <input
                type="text"
                placeholder="搜索商品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-dark-800/80 backdrop-blur-md border border-dark-700 rounded-xl text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-8">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 text-dark-400 hover:bg-dark-700 hover:text-dark-200 transition-all ml-auto">
            <Filter size={16} />
            <span className="text-sm">筛选</span>
          </button>
        </div>

        {endingSoon.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Flame className="text-accent-400" size={24} />
              <h2 className="text-xl font-bold text-dark-100">即将截拍</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {endingSoon.slice(0, 4).map((auction, index) => (
                <AuctionCard key={auction.id} auction={auction} index={index} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-6">
          <Zap className="text-primary-400" size={24} />
          <h2 className="text-xl font-bold text-dark-100">全部拍卖</h2>
          <span className="text-dark-500 text-sm">({activeAuctions.length})</span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-80 animate-pulse" />
            ))}
          </div>
        ) : activeAuctions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {activeAuctions.map((auction, index) => (
              <AuctionCard key={auction.id} auction={auction} index={index} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Clock className="mx-auto mb-4 text-dark-600" size={48} />
            <p className="text-dark-500">暂无相关拍卖商品</p>
          </div>
        )}
      </section>
    </div>
  );
};
