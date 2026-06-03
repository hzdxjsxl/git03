import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useAuctionStore } from '../store';

interface CountdownTimerProps {
  endTime: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const sizeStyles = {
  sm: {
    container: 'gap-1',
    number: 'text-lg font-bold',
    separator: 'text-lg',
    label: 'text-xs',
  },
  md: {
    container: 'gap-2',
    number: 'text-2xl font-bold',
    separator: 'text-2xl',
    label: 'text-xs',
  },
  lg: {
    container: 'gap-3',
    number: 'text-4xl md:text-5xl font-bold font-display',
    separator: 'text-4xl md:text-5xl',
    label: 'text-sm',
  },
};

export const CountdownTimer = ({ endTime, showLabel = true, size = 'md' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const serverTimeOffset = useAuctionStore((state) => state.serverTimeOffset);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const styles = sizeStyles[size];

  const calculateTimeLeft = useCallback((): TimeLeft => {
    const now = Date.now() + serverTimeOffset;
    const difference = endTime - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { days, hours, minutes, seconds };
  }, [endTime, serverTimeOffset]);

  const updateCountdown = useCallback((timestamp: number) => {
    if (timestamp - lastUpdateRef.current >= 1000) {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      lastUpdateRef.current = timestamp;

      const totalSeconds = 
        newTimeLeft.days * 86400 + 
        newTimeLeft.hours * 3600 + 
        newTimeLeft.minutes * 60 + 
        newTimeLeft.seconds;

      setIsUrgent(totalSeconds <= 60 && totalSeconds > 0);
      setIsEnded(totalSeconds <= 0);
    }

    if (!isEnded) {
      animationRef.current = requestAnimationFrame(updateCountdown);
    }
  }, [calculateTimeLeft, isEnded]);

  useEffect(() => {
    const syncTime = async () => {
      await useAuctionStore.getState().syncServerTime();
    };
    syncTime();

    const interval = setInterval(syncTime, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateCountdown);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        useAuctionStore.getState().syncServerTime();
        lastUpdateRef.current = 0;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateCountdown]);

  const padNumber = (num: number): string => num.toString().padStart(2, '0');

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={`
          ${styles.number}
          ${isUrgent ? 'text-red-500 animate-pulse-fast' : isEnded ? 'text-dark-500' : 'text-accent-400'}
          transition-colors duration-300
        `}
      >
        {padNumber(value)}
      </div>
      {showLabel && (
        <span className={`${styles.label} text-dark-400 uppercase tracking-wider`}>
          {label}
        </span>
      )}
    </div>
  );

  if (isEnded) {
    return (
      <div className="flex items-center gap-2 text-dark-400">
        <AlertTriangle size={size === 'lg' ? 24 : 16} />
        <span className={size === 'lg' ? 'text-xl font-medium' : 'text-sm font-medium'}>
          拍卖已结束
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showLabel && size === 'lg' && (
        <div className="flex items-center gap-2 text-dark-300">
          <Clock size={18} />
          <span className="text-sm font-medium">剩余时间</span>
        </div>
      )}
      <div className={`flex items-center ${styles.container}`}>
        <TimeBlock value={timeLeft.days} label="天" />
        <span className={`${styles.separator} text-dark-500`}>:</span>
        <TimeBlock value={timeLeft.hours} label="时" />
        <span className={`${styles.separator} text-dark-500`}>:</span>
        <TimeBlock value={timeLeft.minutes} label="分" />
        <span className={`${styles.separator} text-dark-500`}>:</span>
        <TimeBlock value={timeLeft.seconds} label="秒" />
      </div>
    </div>
  );
};
