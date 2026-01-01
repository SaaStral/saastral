import { useTranslations } from 'next-intl'
import { mockCategorySpends, mockDepartmentSpends, formatCurrency } from '@/lib/mockData'

export function SpendingTab() {
  const t = useTranslations('reports.spending')
  const tDept = useTranslations('reports.spending.departments')

  return (
    <div className="space-y-7">
      <h2 className="font-sora text-xl font-semibold text-[#f0fdf4]">
        {t('title')} <span className="text-[#6ee7b7] font-normal text-base">{t('periodLabel', { period: 'Dezembro 2024' })}</span>
      </h2>

      <div className="grid grid-cols-2 gap-5">
        {/* By Category */}
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(16,185,129,0.15)]">
            <h3 className="font-sora text-base font-semibold text-[#f0fdf4]">{t('byCategoryTitle')}</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              {mockCategorySpends.map((cat) => (
                <div key={cat.category} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a7f3d0] capitalize">{cat.category}</span>
                    <span className="font-jetbrains text-[#f0fdf4]">
                      {formatCurrency(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#022c22] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${cat.percentage}%`,
                        background: cat.category === 'productivity' ? '#10b981' :
                                  cat.category === 'infrastructure' ? '#ec4899' :
                                  cat.category === 'sales' ? '#f97316' :
                                  cat.category === 'development' ? '#3b82f6' :
                                  cat.category === 'design' ? '#8b5cf6' :
                                  '#06b6d4',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By Department */}
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(16,185,129,0.15)]">
            <h3 className="font-sora text-base font-semibold text-[#f0fdf4]">{t('byDepartmentTitle')}</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col gap-4">
              {mockDepartmentSpends.map((dept) => (
                <div key={dept.department} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#a7f3d0] capitalize">{tDept(dept.department)}</span>
                    <span className="font-jetbrains text-[#f0fdf4]">
                      {formatCurrency(dept.amount)} ({dept.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#022c22] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${dept.percentage}%`,
                        background: dept.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
