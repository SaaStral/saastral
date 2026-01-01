'use client'

import { Edit, Calendar, Users, FileText, MoreVertical, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatCurrency, type Subscription } from '@/lib/mockData'

interface SubscriptionViewModeProps {
  subscription: Subscription
  onEdit: () => void
}

export function SubscriptionViewMode({
  subscription,
  onEdit,
}: SubscriptionViewModeProps) {
  const t = useTranslations('subscriptions')

  // Mock data for view mode
  const mockUsers = [
    {
      id: '1',
      name: 'Ricardo Mendes',
      initials: 'RM',
      department: 'Engenharia',
      lastActivity: 'Há 30 min',
      isActive: true,
    },
    {
      id: '2',
      name: 'Maria Santos',
      initials: 'MS',
      department: 'Produto',
      lastActivity: 'Há 2 horas',
      isActive: true,
    },
    {
      id: '3',
      name: 'Pedro Costa',
      initials: 'PC',
      department: 'Engenharia',
      lastActivity: 'Há 3 horas',
      isActive: true,
    },
    {
      id: '4',
      name: 'Bruno Ferreira',
      initials: 'BF',
      department: 'Produto',
      lastActivity: '45 dias',
      isActive: false,
    },
    {
      id: '5',
      name: 'Juliana Alves',
      initials: 'JA',
      department: 'Admin',
      lastActivity: '60 dias',
      isActive: false,
    },
  ]

  const activeUsers = mockUsers.filter((u) => u.isActive)
  const inactiveUsers = mockUsers.filter((u) => !u.isActive)
  const inactiveCount = subscription.totalSeats - subscription.usedSeats
  const unusedSeatsValue =
    (subscription.monthlyCostCents / subscription.totalSeats) * inactiveCount

  return (
    <div className="px-6 py-6">
      {/* Header with logo */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${subscription.icon.gradient.from} 0%, ${subscription.icon.gradient.to} 100%)`,
            color: subscription.icon.textColor,
          }}
        >
          {subscription.icon.text}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-[#f0fdf4] mb-1">
            {subscription.name}
          </h2>
          <p className="text-sm text-[#6ee7b7]">
            {subscription.name.toLowerCase()}.com •{' '}
            {t(`categories.${subscription.category}`)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            {t('drawer.edit')}
          </button>
          <button className="p-2 text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold font-jetbrains text-[#f0fdf4] mb-1">
            {formatCurrency(subscription.monthlyCostCents)}
          </div>
          <div className="text-xs text-[#6ee7b7] mb-1">{t('drawer.perMonth')}</div>
          <div className="text-xs text-[#4ade80]">
            {formatCurrency(subscription.monthlyCostCents * 12)}/
            {t('drawer.perYear')}
          </div>
        </div>
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold font-jetbrains text-[#f0fdf4] mb-1">
            {subscription.usedSeats}/{subscription.totalSeats}
          </div>
          <div className="text-xs text-[#6ee7b7] mb-1">{t('drawer.seats')}</div>
          <div className="text-xs text-[#4ade80]">
            {subscription.totalSeats - subscription.usedSeats}{' '}
            {t('drawer.available')}
          </div>
        </div>
        <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold font-jetbrains text-[#f0fdf4] mb-1">
            {subscription.adoptionRate.toFixed(0)}%
          </div>
          <div className="text-xs text-[#6ee7b7] mb-2">
            {t('drawer.adoption')}
          </div>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-[#022c22] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10b981] rounded-full"
                style={{ width: `${subscription.adoptionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Renewal Section */}
      <ViewSection icon={Calendar} title={t('drawer.renewal')}>
        <div className="flex items-start gap-3 p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl mb-3">
          <span className="text-2xl">📅</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#f0fdf4] mb-1">
              {t('drawer.nextRenewal')}: {subscription.renewalDate}
            </h4>
            <p className="text-xs text-[#6ee7b7]">
              {t('charts.inDays', { count: subscription.daysUntilRenewal })} •{' '}
              {t('drawer.annualCycle')} • {t('drawer.autoRenew')}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-xl mb-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-[#fbbf24] mb-1">
              {t('drawer.cancelDeadline')}: 15/12/2024
            </h4>
            <p className="text-xs text-[#f59e0b]">{t('drawer.deadlinePassed')}</p>
          </div>
        </div>
        <div className="text-xs text-[#6ee7b7] mb-4">
          {t('drawer.responsible')}: Maria Santos (TI)
        </div>
        <div className="flex gap-3">
          <button className="flex-1 px-3 py-2 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            {t('drawer.scheduleReminder')}
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            {t('drawer.startRenegotiation')}
          </button>
        </div>
      </ViewSection>

      {/* Users Section */}
      <ViewSection
        icon={Users}
        title={`${t('drawer.users')} (${subscription.usedSeats} ${t('drawer.activeOf')} ${subscription.totalSeats} ${t('drawer.licenses')})`}
        action={
          <button className="px-3 py-1.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            {t('drawer.manage')}
          </button>
        }
      >
        <div className="space-y-2 mb-4">
          {activeUsers.map((user) => (
            <UserItem key={user.id} user={user} />
          ))}

          {inactiveUsers.length > 0 && (
            <>
              <div className="text-xs font-medium text-[#6ee7b7] uppercase tracking-wider py-2 px-3 bg-[#022c22] rounded-lg mt-4">
                {t('drawer.noRecentActivity')}
              </div>
              {inactiveUsers.map((user) => (
                <UserItem key={user.id} user={user} />
              ))}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 p-3 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-xl mb-3">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
          <span className="text-sm text-[#fbbf24]">
            {inactiveCount} {t('drawer.usersInactive')}
          </span>
        </div>

        <div className="p-3 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl mb-4 text-center">
          <span className="text-sm text-[#6ee7b7]">
            💰 {t('drawer.potentialSavings')}:{' '}
            <strong className="text-[#10b981]">
              {formatCurrency(unusedSeatsValue)}/mês
            </strong>
          </span>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 px-3 py-2 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-lg hover:bg-[rgba(5,150,105,0.08)] transition-all">
            {t('drawer.notifyInactive')}
          </button>
          <button className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-lg hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all">
            {t('drawer.revokeIdleLicenses')}
          </button>
        </div>
      </ViewSection>

      {/* Contract Details */}
      <ViewSection icon={FileText} title={t('drawer.contractDetails')}>
        <div className="grid grid-cols-2 gap-4">
          <ContractItem label={t('drawer.model')} value={t('drawer.perUser')} />
          <ContractItem
            label={t('drawer.pricePerLicense')}
            value={formatCurrency(
              subscription.monthlyCostCents / subscription.totalSeats
            )}
          />
          <ContractItem
            label={t('drawer.licenseType')}
            value={t('drawer.named')}
          />
          <ContractItem label={t('drawer.startDate')} value="15/01/2024" />
          <ContractItem
            label={t('drawer.payment')}
            value={t('drawer.creditCard')}
          />
          <ContractItem label={t('drawer.costCenter')} value="CC-TI-001" />
        </div>
      </ViewSection>
    </div>
  )
}

function ViewSection({
  icon: Icon,
  title,
  action,
  children,
}: {
  icon: any
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-base font-semibold text-[#f0fdf4]">
          <Icon className="w-4 h-4 text-[#10b981]" />
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function UserItem({ user }: { user: any }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl hover:border-[rgba(16,185,129,0.3)] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#059669] to-[#0d9488] flex items-center justify-center text-white text-sm font-semibold">
          {user.initials}
        </div>
        <div>
          <h5 className="text-sm font-medium text-[#f0fdf4]">{user.name}</h5>
          <p className="text-xs text-[#6ee7b7]">{user.department}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#6ee7b7]">
        {user.lastActivity}
        <span
          className={`w-2 h-2 rounded-full ${
            user.isActive ? 'bg-[#10b981]' : 'bg-[#6b7280]'
          }`}
        />
      </div>
    </div>
  )
}

function ContractItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[#6ee7b7] mb-1">{label}</div>
      <div className="text-sm font-medium text-[#f0fdf4]">{value}</div>
    </div>
  )
}
