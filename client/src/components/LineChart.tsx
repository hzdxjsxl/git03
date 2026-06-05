import ReactECharts from 'echarts-for-react';
import { TrendData } from '../types';
import { FIELD_LABELS } from '../utils/dataProcessor';

interface LineChartProps {
  data: TrendData[];
  fields: string[];
  playerName?: string;
  title?: string;
}

const CHART_COLORS = ['#00F5D4', '#7C3AED', '#FF6B6B', '#FBBF24', '#3B82F6'];

export default function LineChart({ 
  data, 
  fields, 
  playerName = '',
  title = '选手表现趋势' 
}: LineChartProps) {
  const displayTitle = playerName ? `${playerName} - ${title}` : title;

  const series = fields.map((field, index) => ({
    name: FIELD_LABELS[field] || field,
    type: 'line',
    data: data.map(d => d[field]),
    smooth: true,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 3,
      color: CHART_COLORS[index % CHART_COLORS.length],
      shadowBlur: 10,
      shadowColor: CHART_COLORS[index % CHART_COLORS.length],
    },
    itemStyle: {
      color: CHART_COLORS[index % CHART_COLORS.length],
      borderColor: '#fff',
      borderWidth: 2,
      shadowBlur: 8,
      shadowColor: CHART_COLORS[index % CHART_COLORS.length],
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: CHART_COLORS[index % CHART_COLORS.length] + '40' },
          { offset: 1, color: CHART_COLORS[index % CHART_COLORS.length] + '05' },
        ],
      },
    },
    emphasis: {
      focus: 'series',
      itemStyle: {
        borderWidth: 3,
        shadowBlur: 15,
      },
    },
  }));

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: displayTitle,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#00F5D4',
        fontSize: 16,
        fontFamily: 'Orbitron, sans-serif',
        textShadow: '0 0 10px rgba(0, 245, 212, 0.5)',
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: 'rgba(0, 245, 212, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#E2E8F0',
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.3)',
        },
        crossStyle: {
          color: 'rgba(0, 245, 212, 0.5)',
        },
      },
    },
    legend: {
      data: fields.map(f => FIELD_LABELS[f] || f),
      bottom: 10,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 11,
      },
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '18%',
      bottom: '15%',
    },
    xAxis: {
      type: 'category',
      data: data.map(d => `第${d.matchNumber}场`),
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.5)',
        },
      },
      axisLabel: {
        color: '#E2E8F0',
        fontSize: 10,
        rotate: 30,
      },
      axisTick: {
        alignWithLabel: true,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: true,
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.5)',
        },
      },
      axisLabel: {
        color: '#E2E8F0',
        fontSize: 10,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.1)',
          type: 'dashed',
        },
      },
    },
    series,
    animationDuration: 1500,
    animationEasing: 'cubicOut',
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%', minHeight: '350px' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
