'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Building2,
  Link as LinkIcon,
  Users,
  Bell,
  Tag,
  LayoutGrid,
  Zap,
  Wrench,
  Shield,
  CreditCard,
  FileText
} from 'lucide-react'
import { OrganizationTab } from '@/components/settings/OrganizationTab'
import { IntegrationsTab } from '@/components/settings/IntegrationsTab'

type TabType = 'organization' | 'integrations' | 'users' | 'notifications' | 'categories' | 'departments' | 'alerts' | 'api' | 'data' | 'plan' | 'audit'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const [activeTab, setActiveTab] = useState<TabType>('organization')

  const navSections = [
    {
      label: t('nav.general'),
      items: [
        { id: 'organization' as TabType, label: t('nav.organization'), icon: Building2 },
        { id: 'integrations' as TabType, label: t('nav.integrations'), icon: LinkIcon, badge: '2' },
        { id: 'users' as TabType, label: t('nav.users'), icon: Users },
        { id: 'notifications' as TabType, label: t('nav.notifications'), icon: Bell },
      ]
    },
    {
      label: t('nav.customization'),
      items: [
        { id: 'categories' as TabType, label: t('nav.categories'), icon: Tag },
        { id: 'departments' as TabType, label: t('nav.departments'), icon: LayoutGrid },
        { id: 'alerts' as TabType, label: t('nav.alertRules'), icon: Zap },
      ]
    },
    {
      label: t('nav.advanced'),
      items: [
        { id: 'api' as TabType, label: t('nav.api'), icon: Wrench },
        { id: 'data' as TabType, label: t('nav.data'), icon: Shield },
      ]
    }
  ]

  const bottomItems = [
    { id: 'plan' as TabType, label: t('nav.plan'), icon: CreditCard },
    { id: 'audit' as TabType, label: t('nav.audit'), icon: FileText, premium: true },
  ]

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Settings Navigation */}
      <nav className="w-[260px] bg-[#033a2d] border-r border-[rgba(16,185,129,0.15)] px-3 py-5 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <div className="text-[0.6875rem] font-semibold uppercase tracking-wider text-[#6ee7b7] px-3 mb-2">
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4] shadow-[0_0_20px_rgba(5,150,105,0.3)]'
                      : 'text-[#a7f3d0] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-[rgba(5,150,105,0.15)] text-[#6ee7b7]">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}

        <div className="h-px bg-[rgba(16,185,129,0.15)] my-4" />

        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] text-[#f0fdf4] shadow-[0_0_20px_rgba(5,150,105,0.3)]'
                  : 'text-[#a7f3d0] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)]'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.premium && (
                <span className="px-2 py-0.5 text-[0.6875rem] font-semibold rounded-full bg-gradient-to-r from-[#d97706] to-[#fbbf24] text-[#022c22]">
                  🔒 Enterprise
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8 max-w-[900px]">
        {activeTab === 'organization' && <OrganizationTab />}
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab !== 'organization' && activeTab !== 'integrations' && (
          <div>
            <p className="text-[#f0fdf4]">{activeTab} Tab (Coming Soon)</p>
          </div>
        )}
      </div>
    </div>
  )
}
