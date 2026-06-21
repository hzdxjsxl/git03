import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { Platform } from '../../../shared/types';

interface PlatformPieChartProps {
  data: Record<Platform, number>;
  height?: number;
}

const PLATFORM_NAMES: Record<Platform, string> = {
  weibo: '微博',
  wechat: '微信',
  douyin: '抖音',
  xiaohongshu: '小红书',
  bilibili: 'B站'
};

const PLATFORM_COLORS: Record<Platform, string> = {
  weibo: '#e6162d',
  wechat: '#07c160',
  douyin: '#000000',
  xiaohongshu: '#fe2c55',
  bilibili: '#00a1d6'
};

export default function PlatformPieChart({ data, height = 280 }: PlatformPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const chartData = Object.entries(data).map(([platform, value]) => ({
      name: PLATFORM_NAMES[platform as Platform] || platform,
      value,
      itemStyle: {
        color: PLATFORM_COLORS[platform as Platform] || '#3b82f6'
      }
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        textStyle: { color: '#94a3b8', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 12
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#0a1628',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#e2e8f0'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData,
        animationDuration: 1200,
        animationEasing: 'elasticOut'
      }]
    };

    chartInstance.current.setOption(option, true);

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return (
    <div
      ref={chartRef}
      style={{ height, width: '100%' }}
      className="chart-container"
    />
  );
}
