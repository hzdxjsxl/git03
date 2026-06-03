import { useEffect, useRef, useState, useCallback } from 'react';
import type { BidRecord } from '../../../types';

interface PriceChartProps {
  bids: BidRecord[];
  width?: number;
  height?: number;
}

interface TooltipData {
  x: number;
  y: number;
  price: number;
  time: number;
  userName: string;
}

export const PriceChart = ({ bids, width = 600, height = 200 }: PriceChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const animationRef = useRef<number>();
  const progressRef = useRef(0);

  const padding = { top: 20, right: 60, bottom: 40, left: 20 };

  const drawChart = useCallback((ctx: CanvasRenderingContext2D, chartWidth: number, chartHeight: number, animationProgress: number) => {
    ctx.clearRect(0, 0, chartWidth, chartHeight);

    if (bids.length < 2) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无出价记录', chartWidth / 2, chartHeight / 2);
      return;
    }

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const prices = bids.map((b) => b.price);
    const times = bids.map((b) => b.timestamp);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const getX = (time: number) => {
      return padding.left + ((time - minTime) / (maxTime - minTime)) * innerWidth;
    };

    const getY = (price: number) => {
      return padding.top + (1 - (price - minPrice) / (maxPrice - minPrice)) * innerHeight;
    };

    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (innerHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(chartWidth - padding.right, y);
      ctx.stroke();

      const price = maxPrice - ((maxPrice - minPrice) / 4) * i;
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`¥${price.toLocaleString()}`, chartWidth - padding.right + 8, y + 4);
    }

    const points = bids.map((bid) => ({
      x: getX(bid.timestamp),
      y: getY(bid.price),
      price: bid.price,
      time: bid.timestamp,
      userName: bid.userName,
    }));

    const visiblePoints = Math.ceil(points.length * animationProgress);
    const visibleData = points.slice(0, visiblePoints);

    if (visibleData.length >= 2) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, chartHeight - padding.bottom);
      gradient.addColorStop(0, 'rgba(13, 148, 136, 0.3)');
      gradient.addColorStop(1, 'rgba(13, 148, 136, 0)');

      ctx.beginPath();
      ctx.moveTo(visibleData[0].x, chartHeight - padding.bottom);
      
      for (let i = 0; i < visibleData.length - 1; i++) {
        const xc = (visibleData[i].x + visibleData[i + 1].x) / 2;
        const yc = (visibleData[i].y + visibleData[i + 1].y) / 2;
        ctx.quadraticCurveTo(visibleData[i].x, visibleData[i].y, xc, yc);
      }
      
      const lastPoint = visibleData[visibleData.length - 1];
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(lastPoint.x, chartHeight - padding.bottom);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(visibleData[0].x, visibleData[0].y);
      
      for (let i = 0; i < visibleData.length - 1; i++) {
        const xc = (visibleData[i].x + visibleData[i + 1].x) / 2;
        const yc = (visibleData[i].y + visibleData[i + 1].y) / 2;
        ctx.quadraticCurveTo(visibleData[i].x, visibleData[i].y, xc, yc);
      }
      
      ctx.lineTo(lastPoint.x, lastPoint.y);
      ctx.strokeStyle = '#0D9488';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      visibleData.forEach((point, index) => {
        const isLast = index === visibleData.length - 1;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, isLast ? 6 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? '#F59E0B' : '#0D9488';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, isLast ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isLast ? 'rgba(245, 158, 11, 0.2)' : 'rgba(13, 148, 136, 0.2)';
        ctx.fill();
      });
    }

    if (tooltip && animationProgress >= 1) {
      ctx.beginPath();
      ctx.arc(tooltip.x, tooltip.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(tooltip.x, tooltip.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#F59E0B';
      ctx.fill();
    }

    const timeLabels = [minTime, (minTime + maxTime) / 2, maxTime];
    timeLabels.forEach((time) => {
      const x = getX(time);
      const date = new Date(time);
      const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      
      ctx.fillStyle = '#64748b';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, x, chartHeight - padding.bottom + 20);
    });
  }, [bids, padding, tooltip]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!canvasRef.current || bids.length < 2) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const innerWidth = canvas.width - padding.left - padding.right;
    const innerHeight = canvas.height - padding.top - padding.bottom;

    const prices = bids.map((b) => b.price);
    const times = bids.map((b) => b.timestamp);
    const minPrice = Math.min(...prices) * 0.95;
    const maxPrice = Math.max(...prices) * 1.05;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const getX = (time: number) => {
      return padding.left + ((time - minTime) / (maxTime - minTime)) * innerWidth;
    };

    const getY = (price: number) => {
      return padding.top + (1 - (price - minPrice) / (maxPrice - minPrice)) * innerHeight;
    };

    let closestBid: BidRecord | null = null;
    let closestDistance = Infinity;

    bids.forEach((bid) => {
      const bidX = getX(bid.timestamp);
      const bidY = getY(bid.price);
      const distance = Math.sqrt(Math.pow(x - bidX, 2) + Math.pow(y - bidY, 2));

      if (distance < closestDistance && distance < 30) {
        closestDistance = distance;
        closestBid = bid;
      }
    });

    if (closestBid) {
      setTooltip({
        x: getX(closestBid.timestamp),
        y: getY(closestBid.price),
        price: closestBid.price,
        time: closestBid.timestamp,
        userName: closestBid.userName,
      });
    } else {
      setTooltip(null);
    }
  }, [bids, padding]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
      
      progressRef.current = 0;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      progressRef.current = Math.min(progressRef.current + 0.03, 1);
      drawChart(ctx, canvas.width / (window.devicePixelRatio || 1), height, progressRef.current);
      
      if (progressRef.current < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [bids, height, drawChart, handleMouseMove, handleMouseLeave]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-4">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">出价走势</h3>
      <div ref={containerRef} className="relative w-full" style={{ height }}>
        <canvas ref={canvasRef} className="cursor-crosshair" />
        
        {tooltip && (
          <div
            className="absolute z-10 pointer-events-none glass-card px-3 py-2 text-sm"
            style={{
              left: Math.min(tooltip.x + 10, width - 150),
              top: tooltip.y - 60,
            }}
          >
            <div className="font-medium text-primary-400">¥{tooltip.price.toLocaleString()}</div>
            <div className="text-dark-400 text-xs">{tooltip.userName}</div>
            <div className="text-dark-500 text-xs">{formatTime(tooltip.time)}</div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-dark-500">
        <span>共 {bids.length} 次出价</span>
        <span>最高 ¥{bids.length > 0 ? Math.max(...bids.map(b => b.price)).toLocaleString() : 0}</span>
      </div>
    </div>
  );
};
