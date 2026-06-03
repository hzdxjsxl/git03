import { Link, useLocation } from 'react-router-dom';
import { Gavel, PlusCircle, User } from 'lucide-react';
import { useUserStore } from '../../modules/user/store';

export const Navbar = () => {
  const location = useLocation();
  const { currentUser } = useUserStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-lg border-b border-dark-800">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Gavel size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold font-display bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
              竞拍网
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              to="/publish"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/publish')
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              }`}
            >
              <PlusCircle size={18} />
              <span className="hidden sm:inline">发布拍卖</span>
            </Link>

            <Link
              to="/user"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive('/user')
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
              }`}
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <User size={18} />
              )}
              <span className="hidden sm:inline">{currentUser?.name || '登录'}</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
