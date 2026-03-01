import { useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/format'

interface DepartmentBreakdown {
  name: string
  employeeCount: number
  monthlyCost: number
  percentage: number
  color: string
}

interface DepartmentBreakdownCardProps {
  departments: DepartmentBreakdown[]
}

export function DepartmentBreakdownCard({
  departments,
}: DepartmentBreakdownCardProps) {
  const t = useTranslations('employees.departments')

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
        <h2 className="font-sora text-base font-semibold text-[#f0fdf4]">
          {t('title')}
        </h2>
      </div>
      <div className="px-6 py-5">
        {departments.map((dept, index) => (
          <div key={index} className={index !== 0 ? 'mt-5' : ''}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-[#f0fdf4]">{dept.name}</span>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-[#a7f3d0]">
                  {dept.employeeCount} {t('people')}
                </span>
                <span className="text-[#6ee7b7] font-jetbrains">
                  {formatCurrency(dept.monthlyCost)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-[#022c22] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${dept.percentage}%`,
                  backgroundColor: dept.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
