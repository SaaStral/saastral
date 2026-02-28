'use client'

import { useState } from 'react'
import { Search, Download, MoreHorizontal, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tooltip } from '@/components/ui'
import { trpc } from '@/lib/trpc/client'
import { formatCurrency } from '@/lib/format'

type EmployeeStatus = 'active' | 'suspended' | 'offboarded'

interface EmployeeListItem {
  id: string
  name: string
  email: string
  department: string
  status: EmployeeStatus
  licenseCount: number
  licenses: Array<{
    name: string
    icon: string
    color: string
  }>
  monthlyCost: number
  lastActivityTime: string
  activitySource: string
  avatar: {
    initials: string
    color: string
  }
  hasWarning: boolean
}

interface EmployeesTableProps {
  initialData?: {
    employees: EmployeeListItem[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
      hasMore: boolean
    }
  }
  organizationId: string
}

export function EmployeesTable({ initialData, organizationId }: EmployeesTableProps) {
  const t = useTranslations('employees')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'offboarding' | 'offboarded'>('all')
  const [page, setPage] = useState(1)

  // Use tRPC query with initial data from server
  const { data, isLoading, isFetching } = trpc.employee.list.useQuery(
    {
      organizationId,
      search: searchQuery || undefined,
      status: statusFilter,
      page,
      pageSize: 20,
    },
    {
      initialData,
      // Keep previous data while fetching new data
      placeholderData: (previousData) => previousData,
    }
  )

  const employees = data?.employees ?? []
  const pagination = data?.pagination

  return (
    <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
        <h2 className="font-sora text-base font-semibold text-[#f0fdf4]">
          {t('table.title')}
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#022c22] border border-[rgba(16,185,129,0.15)] rounded-lg w-64">
            <Search className="w-4 h-4 text-[#6ee7b7]" />
            <input
              type="text"
              placeholder={t('list.search')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1) // Reset to page 1 on search
              }}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[#f0fdf4] placeholder:text-[#6ee7b7]"
            />
            {isFetching && (
              <div className="w-4 h-4 border-2 border-[#6ee7b7] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {/* Status Filter */}
          <div className="flex bg-[#022c22] rounded-lg p-0.5">
            <button
              onClick={() => {
                setStatusFilter('all')
                setPage(1)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                statusFilter === 'all'
                  ? 'bg-[#059669] text-[#f0fdf4]'
                  : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
              }`}
            >
              {t('list.filters.all')}
            </button>
            <button
              onClick={() => {
                setStatusFilter('active')
                setPage(1)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                statusFilter === 'active'
                  ? 'bg-[#059669] text-[#f0fdf4]'
                  : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
              }`}
            >
              {t('list.filters.active')}
            </button>
            <button
              onClick={() => {
                setStatusFilter('offboarding')
                setPage(1)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-all ${
                statusFilter === 'offboarding'
                  ? 'bg-[#059669] text-[#f0fdf4]'
                  : 'text-[#6ee7b7] hover:text-[#f0fdf4]'
              }`}
            >
              {t('status.offboarding')}
            </button>
          </div>

          {/* Export Button */}
          <button className="flex items-center gap-2 px-3.5 py-2 border border-[rgba(16,185,129,0.15)] text-[#a7f3d0] text-sm rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            <Download className="w-4 h-4" />
            {t('table.export')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#022c22] border-b border-[rgba(16,185,129,0.15)]">
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.employee')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.department')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.status')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.licenses')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.costPerMonth')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider cursor-pointer hover:text-[#f0fdf4] transition-colors">
                {t('table.lastActivity')}
              </th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold text-[#6ee7b7] uppercase tracking-wider">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="border-b border-[rgba(16,185,129,0.15)]">
                  <td className="px-5 py-4" colSpan={7}>
                    <div className="h-12 bg-[#064e3b] rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : employees.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <p className="text-[#6ee7b7]">{t('table.noResults')}</p>
                </td>
              </tr>
            ) : (
              employees.map((employee, index) => (
                <tr
                  key={employee.id}
                  className={`hover:bg-[rgba(5,150,105,0.08)] transition-colors ${
                    index !== employees.length - 1
                      ? 'border-b border-[rgba(16,185,129,0.15)]'
                      : ''
                  }`}
                >
                {/* Employee */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                      style={{ backgroundColor: employee.avatar.color }}
                    >
                      {employee.avatar.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#f0fdf4]">
                          {employee.name}
                        </span>
                        {employee.hasWarning && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[rgba(245,158,11,0.15)] rounded text-[10px] font-semibold text-[#f59e0b]">
                            <AlertCircle className="w-3 h-3" />
                            {t('table.daysWarning')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-[#6ee7b7]">
                        {employee.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getDepartmentStyle(employee.department)}`}
                  >
                    {getDepartmentLabel(employee.department)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      employee.status === 'active'
                        ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
                        : employee.status === 'suspended'
                          ? 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b]'
                          : 'bg-[rgba(107,114,128,0.15)] text-[#9ca3af]'
                    }`}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        employee.status === 'active'
                          ? 'bg-[#22c55e]'
                          : employee.status === 'suspended'
                            ? 'bg-[#f59e0b]'
                            : 'bg-[#9ca3af]'
                      }`}
                    />
                    {employee.status === 'active'
                      ? t('status.active')
                      : employee.status === 'suspended'
                        ? t('status.offboarding')
                        : t('status.offboarded')}
                  </span>
                </td>

                {/* Licenses */}
                <td className="px-5 py-4">
                  <Tooltip
                    content={
                      <div className="space-y-1.5">
                        {employee.licenses.map((license, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-[#f0fdf4]"
                          >
                            <div
                              className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                              style={{ backgroundColor: license.color }}
                            >
                              {license.icon}
                            </div>
                            <span>{license.name}</span>
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <span className="text-sm text-[#a7f3d0] whitespace-nowrap">
                        {employee.licenseCount}{' '}
                        {employee.licenseCount === 1
                          ? t('table.license')
                          : t('table.licensesPlural')}
                      </span>
                    </div>
                  </Tooltip>
                </td>

                {/* Cost */}
                <td className="px-5 py-4">
                  <span className="font-jetbrains font-medium text-[#f0fdf4]">
                    {formatCurrency(employee.monthlyCost)}
                  </span>
                </td>

                {/* Last Activity */}
                <td className="px-5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span
                      className={`text-sm ${
                        employee.hasWarning ? 'text-[#f59e0b]' : 'text-[#f0fdf4]'
                      }`}
                    >
                      {employee.lastActivityTime}
                    </span>
                    <span className="text-xs text-[#6ee7b7]">
                      {employee.activitySource}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4">
                  <div className="flex gap-1">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#055540] text-[#6ee7b7] hover:text-[#f0fdf4] transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      {pagination && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(16,185,129,0.15)]">
          <div className="text-sm text-[#6ee7b7]">
            {t('table.showing')} {employees.length} {t('table.of')}{' '}
            {pagination.totalCount} {t('table.employeesCount')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center border border-[rgba(16,185,129,0.15)] rounded-lg text-[#a7f3d0] hover:bg-[#055540] hover:border-[rgba(16,185,129,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ←
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const pageNum = i + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                    page === pageNum
                      ? 'bg-[#059669] border border-[#059669] text-[#f0fdf4]'
                      : 'border border-[rgba(16,185,129,0.15)] text-[#a7f3d0] hover:bg-[#055540] hover:border-[rgba(16,185,129,0.3)]'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasMore}
              className="w-8 h-8 flex items-center justify-center border border-[rgba(16,185,129,0.15)] rounded-lg text-[#a7f3d0] hover:bg-[#055540] hover:border-[rgba(16,185,129,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
function getDepartmentStyle(department: string) {
  const styles: Record<string, string> = {
    engineering: 'bg-[rgba(59,130,246,0.15)] text-[#60a5fa]',
    product: 'bg-[rgba(139,92,246,0.15)] text-[#c084fc]',
    marketing: 'bg-[rgba(236,72,153,0.15)] text-[#f472b6]',
    sales: 'bg-[rgba(249,115,22,0.15)] text-[#fb923c]',
    design: 'bg-[rgba(20,184,166,0.15)] text-[#2dd4bf]',
    admin: 'bg-[rgba(107,114,128,0.15)] text-[#9ca3af]',
  }
  return styles[department] || styles.admin
}

function getDepartmentLabel(department: string) {
  const labels: Record<string, string> = {
    engineering: 'Engineering',
    product: 'Product',
    marketing: 'Marketing',
    sales: 'Sales',
    design: 'Design',
    admin: 'Admin',
  }
  return labels[department] || 'Admin'
}
