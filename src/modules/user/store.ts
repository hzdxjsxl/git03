import { create } from 'zustand';
import type { User } from '../../types';

interface UserStore {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: {
    id: 'demo-user',
    name: '演示用户',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    phone: '138****8888',
  },
  isLoggedIn: true,
  
  login: (user: User) => set({ currentUser: user, isLoggedIn: true }),
  
  logout: () => set({ currentUser: null, isLoggedIn: false }),
  
  setUser: (user: User | null) => set({ currentUser: user, isLoggedIn: !!user }),
}));
