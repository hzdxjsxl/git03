import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export default function AnimatedNumber({
  value,
  duration = 1000,
  decimals = 0,
  suffix = '',
  prefix = '',
  className
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [prevValue, setPrevValue] = useState(0);

  useEffect(() => {
    setPrevValue(displayValue);
    const startTime = Date.now();
    const startValue = prevValue;
    const endValue = value;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatValue = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(decimals);
  };

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}
