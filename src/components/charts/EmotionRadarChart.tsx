import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EmotionDistribution } from '../../../shared/types';

interface EmotionRadarChartProps {
  data: EmotionDistribution | null;
  height?: number;
}

export default function EmotionRadarChart({ data, height = 280 }: EmotionRadarChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    if (!data) {
      chartInstance.current.showLoading({
        text: '加载中...',
        color: '#3b82f6',
        textColor: '#94a3b8',
        maskColor: 'rgba(10, 22, 40, 0.8)',
        zlevel: 0
      });
      return;
    }

    chartInstance.current.hideLoading();

    const indicator = [
      { name: '愤怒', max: 1, color: '#ef4444' },
      { name: '喜悦', max: 1, color: '#10b981' },
      { name: '悲伤', max: 1, color: '#6366f1' },
      { name: '恐惧', max: 1, color: '#f59e0b' },
      { name: '惊讶', max: 1, color: '#ec4899' }
    ];

    const values = [data.anger, data.joy, data.sadness, data.fear, data.surprise];

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 }
      },
      radar: {
        indicator: indicator.map(i => ({ name: i.name, max: i.max })),
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#94a3b8',
          fontSize: 12,
          fontWeight: 500
        },
        splitLine: {
          lineStyle: { color: '#1e293b', type: 'dashed' }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(15, 23, 42, 0.3)', 'rgba(30, 41, 59, 0.2)']
          }
        },
        axisLine: {
          lineStyle: { color: '#334155' }
        }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '情感分布',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#3b82f6'
          },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.1)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.4)' }
            ])
          },
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#fff',
            borderWidth: 2
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(59, 130, 246, 0.8)'
            }
          }
        }],
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
