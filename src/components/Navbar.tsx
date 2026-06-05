import { Link, useLocation } from 'react-router-dom';
import { Sparkles, History, RefreshCw, Settings } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore';
import { cn } from '../lib/utils';

export const Navbar = () => {
  const location = useLocation();
  const refreshFeed = useFeedStore(state => state.refreshFeed);
  const resetProfile = useFeedStore(state => state.resetProfile);
  const readCount = useFeedStore(state => state.readCount);

  const isHome = location.pathname === '/';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">智闻</span>
          </Link>

          <div className="flex items-center gap-2">
            {isHome && (
              <button
                onClick={() => refreshFeed()}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <RefreshCw size={16} />
                <span className="hidden sm:inline">刷新</span>
              </button>
            )}

            <Link
              to="/history"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
                location.pathname === '/history'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <History size={16} />
              <span className="hidden sm:inline">历史</span>
              {readCount > 0 && (
                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {readCount}
                </span>
              )}
            </Link>

            <Link
              to="/features"
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors',
                location.pathname === '/features'
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              )}
            >
              <Settings size={16} />
              <span className="hidden sm:inline">特征</span>
            </Link>

            <button
              onClick={() => {
                if (confirm('确定要重置所有阅读记录和兴趣特征吗？')) {
                  resetProfile();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="重置画像"
            >
              <span className="hidden sm:inline">重置</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
