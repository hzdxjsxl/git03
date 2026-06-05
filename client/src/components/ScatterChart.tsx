import React from 'react';
import ReactECharts from 'echarts-for-react';
import { ScatterData } from '../types';

interface ScatterChartProps {
  data: ScatterData[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function ScatterChart({ 
  data, 
  title = 'Scatter Chart',
  xAxisLabel = 'X',
  yAxisLabel = 'Y'
}: ScatterChartProps) {
  const chartData = data.map(d => ({
    value: [d.x, d.y],
    name: d.name,
    symbolSize: d.size,
    itemStyle: { color: d.color },
    team: d.team,
  }));

  const option = {
    backgroundColor: '#0a1628',
    title: {
      text: title,
      left: 'center',
      top: 10,
      textStyle: {
        color: '#00F5D4',
        fontSize: 16,
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: '#00F5D4',
      borderWidth: 1,
    },
    grid: {
      left: 70,
      right: 50,
      top: 60,
      bottom: 60,
    },
    xAxis: {
      type: 'value',
      name: xAxisLabel,
      nameTextStyle: { color: '#00F5D4', fontSize: 12 },
      axisLine: { lineStyle: { color: '#00F5D4' } },
      axisLabel: { color: '#E2E8F0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 245, 212, 0.1)', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameTextStyle: { color: '#00F5D4', fontSize: 12 },
      axisLine: { lineStyle: { color: '#00F5D4' } },
      axisLabel: { color: '#E2E8F0', fontSize: 10 },
      splitLine: { lineStyle: { color: 'rgba(0, 245, 212, 0.1)', type: 'dashed' } },
    },
    series: [{
      type: 'scatter',
      data: chartData,
      itemStyle: {
        shadowBlur: 10,
        shadowColor: 'rgba(0, 245, 212, 0.5)',
        opacity: 0.85,
      },
    }],
  };

  return (
    <div style={{ backgroundColor: '#0a1628', borderRadius: '8px' }}>
      <ReactECharts
        option={option}
        style={{ height: '350px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
