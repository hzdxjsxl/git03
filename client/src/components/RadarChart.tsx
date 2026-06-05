import ReactECharts from 'echarts-for-react';
import { RadarData, RADAR_INDICATORS } from '../utils/dataProcessor';

interface RadarChartProps {
  data: RadarData[];
  title?: string;
}

export default function RadarChart({ data, title = '选手能力雷达图' }: RadarChartProps) {
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
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
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.9)',
      borderColor: 'rgba(0, 245, 212, 0.5)',
      borderWidth: 1,
      textStyle: {
        color: '#E2E8F0',
        fontFamily: 'Noto Sans SC, sans-serif',
      },
    },
    legend: {
      data: data.map(d => d.name),
      bottom: 10,
      textStyle: {
        color: '#E2E8F0',
        fontSize: 11,
      },
      type: 'scroll',
      pageIconColor: '#00F5D4',
      pageTextStyle: {
        color: '#E2E8F0',
      },
    },
    radar: {
      indicator: RADAR_INDICATORS,
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#00F5D4',
        fontSize: 12,
        fontFamily: 'Noto Sans SC, sans-serif',
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.2)',
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['rgba(0, 245, 212, 0.05)', 'rgba(0, 245, 212, 0.1)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 245, 212, 0.3)',
        },
      },
      center: ['50%', '50%'],
      radius: '55%',
    },
    series: [
      {
        type: 'radar',
        data: data.map(d => ({
          value: d.value,
          name: d.name,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: d.color,
          },
          areaStyle: {
            color: d.color,
            opacity: 0.15,
          },
          itemStyle: {
            color: d.color,
            borderColor: '#fff',
            borderWidth: 1,
            shadowBlur: 10,
            shadowColor: d.color,
          },
        })),
        animationDuration: 1500,
        animationEasing: 'elasticOut',
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: '100%', width: '100%', minHeight: '350px' }}
      opts={{ renderer: 'canvas' }}
    />
  );
}
