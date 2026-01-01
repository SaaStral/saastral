'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { formatCurrency, type CategorySpending } from '@/lib/mockData'

interface SpendingByCategoryCardProps {
  categories: CategorySpending[]
}

type PeriodType = 'month' | '3months' | 'year'

export function SpendingByCategoryCard({
  categories,
}: SpendingByCategoryCardProps) {
  const t = useTranslations('subscriptions')
  const [period, setPeriod] = useState<PeriodType>('month')

  const total = categories.reduce((sum, cat) => sum + cat.amount, 0)

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
        <h2 className="font-sora text-base font-semibold text-[#f0fdf4]">
          {t('charts.spendingByCategory')}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              period === 'month'
                ? 'bg-[#059669] text-white'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('charts.thisMonth')}
          </button>
          <button
            onClick={() => setPeriod('3months')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              period === '3months'
                ? 'bg-[#059669] text-white'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('charts.last3Months')}
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 text-xs rounded-md transition-all ${
              period === 'year'
                ? 'bg-[#059669] text-white'
                : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
            }`}
          >
            {t('charts.thisYear')}
          </button>
        </div>
      </div>
      <div className="px-6 py-6">
        {/* Donut Chart */}
        <div className="relative h-56 flex items-center justify-center mb-6">
          <svg viewBox="0 0 200 200" className="w-full h-full max-w-[220px]">
            <DonutChart categories={categories} total={total} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-jetbrains text-xl font-semibold text-[#f0fdf4]">
              {formatCurrency(total)}
            </div>
            <div className="text-xs text-[#6ee7b7]">
              {t('charts.totalPerMonth')}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {categories.map((category) => (
            <div
              key={category.category}
              className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-[#a7f3d0]">
                {t(`categories.${category.category}`)}
              </span>
              <span className="text-[#f0fdf4] font-jetbrains ml-1">
                {formatCurrency(category.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DonutChart({
  categories,
  total,
}: {
  categories: CategorySpending[]
  total: number
}) {
  const radius = 70
  const innerRadius = 50
  const circumference = 2 * Math.PI * radius

  let cumulativePercentage = 0

  return (
    <g transform="translate(100, 100)">
      {categories.map((category) => {
        const percentage = (category.amount / total) * 100
        const dashArray = (percentage / 100) * circumference
        const dashOffset = -cumulativePercentage * circumference

        const segment = (
          <circle
            key={category.category}
            cx="0"
            cy="0"
            r={radius}
            fill="none"
            stroke={category.color}
            strokeWidth={radius - innerRadius}
            strokeDasharray={`${dashArray} ${circumference}`}
            strokeDashoffset={dashOffset}
            transform="rotate(-90)"
            className="transition-all duration-300"
          />
        )

        cumulativePercentage += percentage / 100

        return segment
      })}
    </g>
  )
}
