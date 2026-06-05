import ReactECharts from 'echarts-for-react';
import { ScatterData } from '../types';
import { FIELD_LABELS } from '../utils/dataProcessor';

interface ScatterChartProps {
  data: ScatterData[];
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function ScatterChart({ 
  data, 
  title = '选手数据散点图',
  xAxisLabel = 'X轴',
  yAxisLabel = 'Y轴'
}: ScatterChartProps) {
  const teams = [...new Set(data.map(d => d.team))];
  
  const series = teams.map(team => ({
    name: team,
    type: 'scatter',
    data: data.filter(d => d.team === team).map(d => [d.x, d.y, d.size, d.name]),
    symbolSize: (data: number[]) => data[2],
    itemStyle: {
      color: data.find(d => d.team === team)?.color || '#00F5D4',
      shadowBlur: 10,
      shadowColor: data.find(d => d.team === team)?.color || '#00F5D4',
      opacity: 0.8,
    },
    emphasis: {
      itemStyle: {
        opacity: 1,
        borderColor: '#fff',
        borderWidth: 2,
      },
    },
  }));

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
      formatter: (params: any) => {
        const item = params.data;
        return `
          <div style="font-family: 'Noto Sans SC', sans-serif;">
            <div style="color: #00F5D4; font-weight: bold; margin-bottom: 5px;">${item[3]}</div>
            <div>${xAxisLabel}: ${item[0].toFixed(2)}</div>
            <div>${yAxisLabel}: ${item[1].toFixed(2)}</div>
          </div>
        `;
      },
    },
    legend: {
      data: teams,
      right: 20,
      top: 40,
      orient: 'vertical',
      textStyle: {
        color: '#E2E8F0',
        fontSize: 11,
      },
    },
    grid: {
      left: '10%',
      right: '20%',
      top: '15%',
      bottom: '10%',
    },
    xAxis: {
      name: xAxisLabel,
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: '#00F5D4',
        fontSize: 12,
      },
      type: 'value',
      axisLine: {
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
    yAxis: {
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#00F5D4',
        fontSize: 12,
      },
      type: 'value',
      axisLine: {
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
    animationDuration: 1000,
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
