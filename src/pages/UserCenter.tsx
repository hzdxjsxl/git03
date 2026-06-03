import { useState } from 'react';
import { User, Package, Gavel, Settings, LogOut, Clock, CheckCircle } from 'lucide-react';
import { useUserStore } from '../modules/user/store';
import { useAuctionStore } from '../modules/auction/store';
import { AuctionCard } from '../modules/auction/components/AuctionCard';

type TabType = 'published' | 'bidding' | 'profile';

export const UserCenter = () => {
  const { currentUser, logout } = useUserStore();
  const { auctions } = useAuctionStore();
  const [activeTab, setActiveTab] = useState<TabType>('published');

  const userAuctions = auctions.filter((a) => a.sellerId === currentUser?.id);
  const biddingAuctions = auctions.slice(0, 3);

  const tabs = [
    { id: 'published' as TabType, label: '我发布的', icon: Package },
    { id: 'bidding' as TabType, label: '我竞拍的', icon: Gavel },
    { id: 'profile' as TabType, label: '个人资料', icon: User },
  ];

  return (
    <div className="container py-8">
      <div className="glass-card p-6 mb-8">
        <div className="flex items-center gap-6">
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-20 h-20 rounded-full bg-dark-700"
          />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-dark-100 font-display">
              {currentUser?.name}
            </h1>
            <p className="text-dark-400 mt-1">{currentUser?.phone}</p>
            <div className="flex items-center gap-4 mt-3">
              <div className="text-sm">
                <span className="text-primary-400 font-medium">{userAuctions.length}</span>
                <span className="text-dark-500 ml-1">发布</span>
              </div>
              <div className="text-sm">
                <span className="text-accent-400 font-medium">{biddingAuctions.length * 5}</span>
                <span className="text-dark-500 ml-1">竞拍</span>
              </div>
              <div className="text-sm">
                <span className="text-green-400 font-medium">3</span>
                <span className="text-dark-500 ml-1">成交</span>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-red-400 transition-all"
          >
            <LogOut size={18} />
            <span>退出</span>
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-dark-800 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'text-dark-400 hover:text-dark-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'published' && (
        <div>
          {userAuctions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userAuctions.map((auction, index) => (
                <AuctionCard key={auction.id} auction={auction} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="mx-auto mb-4 text-dark-600" size={48} />
              <p className="text-dark-500 mb-4">暂无发布的拍卖</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'bidding' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {biddingAuctions.map((auction, index) => (
              <AuctionCard key={auction.id} auction={auction} index={index} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="glass-card p-6 max-w-xl">
          <h3 className="text-lg font-semibold text-dark-100 mb-6">个人资料</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">昵称</label>
              <div className="input-field">{currentUser?.name}</div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">手机号</label>
              <div className="input-field">{currentUser?.phone}</div>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">邮箱</label>
              <div className="input-field text-dark-500">未绑定</div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-dark-700">
            <h4 className="font-medium text-dark-200 mb-4">账户状态</h4>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="text-green-400" size={18} />
              <span className="text-dark-300">实名认证已通过</span>
            </div>
            <div className="flex items-center gap-3 text-sm mt-2">
              <CheckCircle className="text-green-400" size={18} />
              <span className="text-dark-300">手机号已验证</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
