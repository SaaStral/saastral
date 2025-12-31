import { getTranslations } from 'next-intl/server'
import { setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'

interface HomePageProps {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: HomePageProps) {
  // Await params (Next.js 15+ requirement)
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('home')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        {/* Logo */}
        <div className="w-20 h-20 mx-auto mb-8">
          <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" opacity="0.4"/>
            <circle cx="20" cy="20" r="12" stroke="#10b981" strokeWidth="2" opacity="0.6"/>
            <circle cx="20" cy="20" r="6" fill="#059669"/>
            <circle cx="20" cy="2" r="3" fill="#10b981"/>
            <circle cx="35" cy="14" r="2.5" fill="#14b8a6"/>
            <circle cx="8" cy="28" r="2" fill="#10b981" opacity="0.7"/>
          </svg>
        </div>

        <h1 className="text-5xl font-bold mb-4 font-['Sora',sans-serif]">
          Saa<span className="text-[#10b981]">Stral</span>
        </h1>
        <p className="text-xl text-[#a7f3d0] mb-8 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
        <p className="text-[#6ee7b7] mb-12 max-w-xl mx-auto">
          {t('description')}
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-gradient-to-br from-[#059669] to-[#0d9488] text-[#f0fdf4] rounded-[10px] font-medium transition-all duration-[150ms] hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:-translate-y-0.5"
          >
            {t('actions.dashboard')}
          </Link>
          <a
            href="https://github.com/saastral/saastral"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-transparent border border-[rgba(16,185,129,0.3)] text-[#a7f3d0] rounded-[10px] font-medium transition-all duration-[150ms] hover:bg-[rgba(5,150,105,0.08)] hover:border-[rgba(16,185,129,0.5)]"
          >
            {t('actions.github')}
          </a>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="p-6 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-[16px] text-left">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="text-[#f0fdf4] font-semibold mb-2">{t('features.costControl.title')}</h3>
            <p className="text-sm text-[#6ee7b7]">
              {t('features.costControl.description')}
            </p>
          </div>
          <div className="p-6 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-[16px] text-left">
            <div className="text-2xl mb-2">🔔</div>
            <h3 className="text-[#f0fdf4] font-semibold mb-2">{t('features.smartAlerts.title')}</h3>
            <p className="text-sm text-[#6ee7b7]">
              {t('features.smartAlerts.description')}
            </p>
          </div>
          <div className="p-6 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-[16px] text-left">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="text-[#f0fdf4] font-semibold mb-2">{t('features.analytics.title')}</h3>
            <p className="text-sm text-[#6ee7b7]">
              {t('features.analytics.description')}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
