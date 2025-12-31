'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { ChartDataPoint } from '@/lib/mockData'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

type TimeRange = '7d' | '30d' | '90d' | '12m'

interface SpendingChartProps {
  data: ChartDataPoint[]
}

const categoryColors = {
  productivity: { bg: 'rgba(96, 165, 250, 0.15)', border: '#60a5fa' },
  design: { bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc' },
  development: { bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80' },
  salesMarketing: { bg: 'rgba(251, 146, 60, 0.15)', border: '#fb923c' },
  infrastructure: { bg: 'rgba(244, 114, 182, 0.15)', border: '#f472b6' },
}

export function SpendingChart({ data }: SpendingChartProps) {
  const t = useTranslations('dashboard')
  const [timeRange, setTimeRange] = useState<TimeRange>('30d')

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#033a2d',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 1,
        titleColor: '#f0fdf4',
        bodyColor: '#a7f3d0',
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(context.parsed.y / 100)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(16, 185, 129, 0.08)',
          drawTicks: false,
        },
        ticks: {
          color: '#6ee7b7',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: 'rgba(16, 185, 129, 0.08)',
          drawTicks: false,
        },
        ticks: {
          color: '#6ee7b7',
          font: {
            size: 11,
          },
          padding: 8,
          callback: function (value) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 0,
            }).format(Number(value) / 100)
          },
        },
        border: {
          display: false,
        },
      },
    },
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: t('charts.categories.productivity'),
        data: data.map((d) => d.productivity),
        borderColor: categoryColors.productivity.border,
        backgroundColor: categoryColors.productivity.bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: t('charts.categories.design'),
        data: data.map((d) => d.design),
        borderColor: categoryColors.design.border,
        backgroundColor: categoryColors.design.bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: t('charts.categories.development'),
        data: data.map((d) => d.development),
        borderColor: categoryColors.development.border,
        backgroundColor: categoryColors.development.bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: t('charts.categories.salesMarketing'),
        data: data.map((d) => d.salesMarketing),
        borderColor: categoryColors.salesMarketing.border,
        backgroundColor: categoryColors.salesMarketing.bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: t('charts.categories.infrastructure'),
        data: data.map((d) => d.infrastructure),
        borderColor: categoryColors.infrastructure.border,
        backgroundColor: categoryColors.infrastructure.bg,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-6 hover:border-[rgba(16,185,129,0.3)] transition-all duration-300 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-[#f0fdf4]">{t('charts.spendingOverTime')}</h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '12m'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                ${timeRange === range
                  ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4] shadow-md'
                  : 'bg-[rgba(5,150,105,0.08)] text-[#6ee7b7] hover:bg-[rgba(5,150,105,0.15)]'
                }
              `}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[300px]">
        <Line options={chartOptions} data={chartData} />
      </div>

      <div className="mt-6 flex flex-wrap gap-4 flex-shrink-0">
        {[
          { key: 'productivity', color: categoryColors.productivity.border },
          { key: 'design', color: categoryColors.design.border },
          { key: 'development', color: categoryColors.development.border },
          { key: 'salesMarketing', color: categoryColors.salesMarketing.border },
          { key: 'infrastructure', color: categoryColors.infrastructure.border },
        ].map((category) => (
          <div key={category.key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-sm text-[#a7f3d0]">{t(`charts.categories.${category.key}`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
