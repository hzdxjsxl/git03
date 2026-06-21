import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import 'echarts-wordcloud';
import type { KeywordItem } from '../../../shared/types';
import { getSentimentColor } from '../../utils/wordcloud';

interface WordCloudChartProps {
  keywords: KeywordItem[];
  height?: number;
}

export default function WordCloudChart({ keywords, height = 320 }: WordCloudChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const prevDataRef = useRef<KeywordItem[]>([]);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    if (!keywords || keywords.length === 0) {
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

    const maxValue = Math.max(...keywords.map(k => k.value), 1);

    const data = keywords.slice(0, 80).map(kw => ({
      name: kw.name,
      value: Math.round(10 + (kw.value / maxValue) * 60),
      textStyle: {
        color: getSentimentColor(kw.sentiment)
      }
    }));

    const hasSignificantChange = prevDataRef.current.length === 0 ||
      Math.abs(keywords.length - prevDataRef.current.length) > 5 ||
      keywords.some((k, i) => {
        const prev = prevDataRef.current[i];
        return !prev || Math.abs(k.value - prev.value) > prev.value * 0.3;
      });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        show: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: any) => {
          const kw = keywords.find(k => k.name === params.name);
          if (!kw) return params.name;
          const sentimentText = kw.sentiment > 0.3 ? '正面' : kw.sentiment < -0.3 ? '负面' : '中性';
          return `
            <div style="font-weight: bold; margin-bottom: 4px;">${params.name}</div>
            <div>出现次数: ${kw.count}</div>
            <div>情感倾向: ${sentimentText}</div>
            <div>情感值: ${kw.sentiment.toFixed(3)}</div>
          `;
        }
      },
      series: [{
        type: 'wordCloud',
        shape: 'circle',
        left: 'center',
        top: 'center',
        width: '90%',
        height: '90%',
        sizeRange: [12, 70],
        rotationRange: [-45, 45],
        rotationStep: 15,
        gridSize: 8,
        drawOutOfBound: false,
        textStyle: {
          fontFamily: 'Noto Sans SC, sans-serif',
          fontWeight: 'bold'
        },
        emphasis: {
          focus: 'self',
          textStyle: {
            textShadowBlur: 10,
            textShadowColor: 'rgba(59, 130, 246, 0.8)'
          }
        },
        data
      } as any]
    };

    chartInstance.current.setOption(option, hasSignificantChange);
    prevDataRef.current = [...keywords];

    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [keywords]);

  return (
    <div
      ref={chartRef}
      style={{ height, width: '100%' }}
      className="chart-container"
    />
  );
}
