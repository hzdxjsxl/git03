import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useMessageStore } from '../store';
import type { ToastMessage } from '../../../types';

const toastStyles = {
  success: 'bg-primary-500/20 border-primary-500/50 text-primary-400',
  error: 'bg-red-500/20 border-red-500/50 text-red-400',
  warning: 'bg-accent-500/20 border-accent-500/50 text-accent-400',
  info: 'bg-blue-500/20 border-blue-500/50 text-blue-400',
};

const ToastIcon = ({ type }: { type: ToastMessage['type'] }) => {
  const iconProps = { size: 20, className: 'shrink-0' };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} />;
    case 'error':
      return <XCircle {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
  }
};

const ToastItem = ({ toast }: { toast: ToastMessage }) => {
  const { removeToast } = useMessageStore();
  
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-md animate-slide-in-right ${toastStyles[toast.type]}`}
      style={{ minWidth: '320px' }}
    >
      <ToastIcon type={toast.type} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.message && (
          <p className="text-sm opacity-80 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export const ToastContainer = () => {
  const { toasts } = useMessageStore();
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
