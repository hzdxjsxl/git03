import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface SentimentTrendChartProps {
  data: ReturnType<typeof import('../../utils/smoothing').smoothData> | null;
  height?: number;
}

export default function SentimentTrendChart({ data, height = 320 }: SentimentTrendChartProps) {
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

    const timestamps = data.timestamps.map(ts =>
      new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    );

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: '#3b82f6', type: 'dashed' }
        }
      },
      legend: {
        data: ['情感指数', '正面占比', '负面占比', '讨论量'],
        top: 10,
        textStyle: { color: '#94a3b8', fontSize: 12 },
        itemGap: 20
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '18%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10, rotate: 30 },
        splitLine: { show: false }
      },
      yAxis: [
        {
          type: 'value',
          name: '情感指数',
          min: -1,
          max: 1,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
        },
        {
          type: 'value',
          name: '讨论量',
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '情感指数',
          type: 'line',
          data: data.polaritySmoothed,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#3b82f6' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          },
          emphasis: { focus: 'series' },
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        },
        {
          name: '正面占比',
          type: 'line',
          data: data.positive.map(v => v * 2 - 1),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#10b981' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.25)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0)' }
            ])
          },
          emphasis: { focus: 'series' },
          animationDuration: 1000,
          animationDelay: 100,
          animationEasing: 'cubicOut'
        },
        {
          name: '负面占比',
          type: 'line',
          data: data.negative.map(v => -(v * 2 - 1)),
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, color: '#ef4444' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.25)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' }
            ])
          },
          emphasis: { focus: 'series' },
          animationDuration: 1000,
          animationDelay: 200,
          animationEasing: 'cubicOut'
        },
        {
          name: '讨论量',
          type: 'bar',
          yAxisIndex: 1,
          data: data.volumeSmoothed,
          barWidth: '60%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(245, 158, 11, 0.6)' },
              { offset: 1, color: 'rgba(245, 158, 11, 0.1)' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 158, 11, 0.9)' },
                { offset: 1, color: 'rgba(245, 158, 11, 0.2)' }
              ])
            }
          },
          animationDuration: 1000,
          animationDelay: 300,
          animationEasing: 'elasticOut'
        }
      ],
      animation: true,
      animationThreshold: 2000
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
