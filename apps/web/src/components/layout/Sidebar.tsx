'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { Users, Package, Bell, FileText, LayoutDashboard, Settings } from 'lucide-react'

export function Sidebar() {
  const t = useTranslations('navigation')
  const pathname = usePathname()

  const navigation = [
    {
      name: t('main.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: t('main.employees'),
      href: '/employees',
      icon: Users,
    },
    {
      name: t('main.subscriptions'),
      href: '/subscriptions',
      icon: Package,
    },
    {
      name: t('main.alerts'),
      href: '/alerts',
      icon: Bell,
      badge: 5,
    },
    {
      name: t('main.reports'),
      href: '/reports',
      icon: FileText,
    },
  ]

  const configNavigation = [
    {
      name: t('config.settings'),
      href: '/settings',
      icon: Settings,
    },
  ]

  return (
    <aside className="w-[260px] bg-[#022c22] border-r border-[rgba(16,185,129,0.15)] flex flex-col fixed top-0 left-0 bottom-0 z-[100] transition-all duration-[250ms]">
      {/* Logo */}
      <div className="p-5 px-6 border-b border-[rgba(16,185,129,0.15)]">
        <Link href="/dashboard" className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 relative">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" opacity="0.4"/>
              <circle cx="20" cy="20" r="12" stroke="#10b981" strokeWidth="2" opacity="0.6"/>
              <circle cx="20" cy="20" r="6" fill="#059669"/>
              <circle cx="20" cy="2" r="3" fill="#10b981"/>
              <circle cx="35" cy="14" r="2.5" fill="#14b8a6"/>
              <circle cx="8" cy="28" r="2" fill="#10b981" opacity="0.7"/>
            </svg>
          </div>
          <span className="font-['Sora',sans-serif] text-[1.375rem] font-bold text-[#f0fdf4] tracking-[-0.02em]">
            Saa<span className="text-[#10b981]">Stral</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 px-3 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-[10px] text-[0.9375rem] font-medium
                transition-all duration-[150ms] relative mb-1
                ${isActive
                  ? 'bg-gradient-to-br from-[#059669] to-[#0d9488] text-[#f0fdf4] shadow-[0_0_20px_rgba(5,150,105,0.3)]'
                  : 'text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.08)] hover:text-[#f0fdf4]'
                }
              `}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#f0fdf4] rounded-r-[2px]" />
              )}
              <Icon className="w-5 h-5 opacity-85" />
              <span>{item.name}</span>
              {item.badge && (
                <span className="ml-auto bg-[#ef4444] text-white text-[0.75rem] font-semibold px-2 py-0.5 rounded-[10px] min-w-[22px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Configuration Section */}
        <div className="mt-2">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-[#6ee7b7] px-3 py-2 mt-2">
            {t('config.title')}
          </div>
          {configNavigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-[10px] text-[0.9375rem] font-medium
                  transition-all duration-[150ms] relative mb-1
                  ${isActive
                    ? 'bg-gradient-to-br from-[#059669] to-[#0d9488] text-[#f0fdf4] shadow-[0_0_20px_rgba(5,150,105,0.3)]'
                    : 'text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.08)] hover:text-[#f0fdf4]'
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#f0fdf4] rounded-r-[2px]" />
                )}
                <Icon className="w-5 h-5 opacity-85" />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(16,185,129,0.15)]">
        <div className="mb-3">
          <div className="flex items-center gap-2.5 px-3 py-2 text-[0.8125rem] text-[#6ee7b7]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
            <span>Google Workspace</span>
          </div>
          <div className="flex items-center gap-2.5 px-3 py-2 text-[0.8125rem] text-[#6ee7b7]">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shadow-[0_0_8px_#22c55e]" />
            <span>Okta</span>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href="#"
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-[6px] bg-[rgba(5,150,105,0.08)] text-[#6ee7b7] text-[0.8125rem] hover:bg-[#033a2d] hover:text-[#f0fdf4] transition-all duration-[150ms]"
          >
            <span>?</span>
            <span>{t('footer.help')}</span>
          </a>
          <a
            href="#"
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-[6px] bg-[rgba(5,150,105,0.08)] text-[#6ee7b7] text-[0.8125rem] hover:bg-[#033a2d] hover:text-[#f0fdf4] transition-all duration-[150ms]"
          >
            <span>→</span>
            <span>{t('footer.docs')}</span>
          </a>
        </div>
      </div>
    </aside>
  )
}
