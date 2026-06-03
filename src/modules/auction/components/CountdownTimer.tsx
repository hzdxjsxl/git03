import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  totalSeconds: number;
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

const calculateTimeLeft = (endTime: number, serverOffset: number): TimeLeft => {
  const now = Date.now() + serverOffset;
  const difference = endTime - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }

  const totalSeconds = Math.floor(difference / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
};

export const CountdownTimer = ({ endTime, showLabel = true, size = 'md' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  
  const serverTimeOffsetRef = useRef(0);
  const endTimeRef = useRef(endTime);
  const lastUpdateRef = useRef(0);
  const animationRef = useRef<number>();
  const isEndedRef = useRef(false);
  const styles = useMemo(() => sizeStyles[size], [size]);

  useEffect(() => {
    endTimeRef.current = endTime;
    isEndedRef.current = false;
    lastUpdateRef.current = 0;
  }, [endTime]);

  useEffect(() => {
    const store = useAuctionStore.getState();
    serverTimeOffsetRef.current = store.serverTimeOffset;

    const initialTimeLeft = calculateTimeLeft(endTimeRef.current, serverTimeOffsetRef.current);
    setTimeLeft(initialTimeLeft);
    setIsUrgent(initialTimeLeft.totalSeconds <= 60 && initialTimeLeft.totalSeconds > 0);
    setIsEnded(initialTimeLeft.totalSeconds <= 0);
    isEndedRef.current = initialTimeLeft.totalSeconds <= 0;
  }, []);

  const updateCountdown = useCallback((timestamp: number) => {
    if (isEndedRef.current) return;

    if (timestamp - lastUpdateRef.current >= 1000) {
      const currentOffset = useAuctionStore.getState().serverTimeOffset;
      serverTimeOffsetRef.current = currentOffset;
      
      const newTimeLeft = calculateTimeLeft(endTimeRef.current, currentOffset);
      setTimeLeft(newTimeLeft);
      lastUpdateRef.current = timestamp;

      const { totalSeconds } = newTimeLeft;
      setIsUrgent(totalSeconds <= 60 && totalSeconds > 0);
      
      if (totalSeconds <= 0) {
        setIsEnded(true);
        isEndedRef.current = true;
        return;
      }
    }

    animationRef.current = requestAnimationFrame(updateCountdown);
  }, []);

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
        
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        animationRef.current = requestAnimationFrame(updateCountdown);
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

  const TimeBlock = ({ value, label, isFinal }: { value: number; label: string; isFinal?: boolean }) => (
    <div className="flex flex-col items-center">
      <div
        className={`
          ${styles.number}
          transition-colors duration-300
          ${isUrgent && !isFinal ? 'text-red-500 animate-pulse-fast' : ''}
          ${isEnded ? 'text-dark-500' : ''}
          ${!isUrgent && !isEnded ? 'text-accent-400' : ''}
          ${isFinal ? 'text-red-500' : ''}
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
        <TimeBlock value={timeLeft.seconds} label="秒" isFinal={isUrgent} />
      </div>
    </div>
  );
};
