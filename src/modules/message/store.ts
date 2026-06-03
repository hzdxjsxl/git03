import { create } from 'zustand';
import type { ToastMessage } from '../../types';

interface MessageStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const generateId = (): string => Math.random().toString(36).substring(2, 15);

export const useMessageStore = create<MessageStore>((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = generateId();
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    const duration = toast.duration ?? 3000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clearToasts: () => set({ toasts: [] }),
}));
