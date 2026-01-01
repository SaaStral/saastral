'use client'

import { useTranslations } from 'next-intl'
import { Upload } from 'lucide-react'

export function OrganizationTab() {
  const t = useTranslations('settings.organization')

  return (
    <div>
      <h2 className="font-sora text-xl font-semibold text-[#f0fdf4] mb-2">{t('title')}</h2>
      <p className="text-[0.9375rem] text-[#6ee7b7] mb-6">{t('description')}</p>

      <div className="bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-2xl p-8">
        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#6ee7b7] mb-2">
              {t('name')}
            </label>
            <input
              type="text"
              placeholder={t('namePlaceholder')}
              className="w-full bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl px-4 py-2.5 text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {/* Domain */}
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#6ee7b7] mb-2">
              {t('domain')}
            </label>
            <input
              type="text"
              placeholder={t('domainPlaceholder')}
              className="w-full bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl px-4 py-2.5 text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#6ee7b7] mb-2">
              {t('logo')}
            </label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl flex items-center justify-center">
                <span className="text-[#059669] text-2xl font-bold">A</span>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl text-[#6ee7b7] hover:bg-[#033a2d] hover:border-[#10b981] transition-colors">
                <Upload className="w-4 h-4" />
                {t('uploadLogo')}
              </button>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#6ee7b7] mb-2">
              {t('address')}
            </label>
            <input
              type="text"
              placeholder={t('addressPlaceholder')}
              className="w-full bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl px-4 py-2.5 text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {/* Tax ID */}
          <div>
            <label className="block text-[0.8125rem] font-medium text-[#6ee7b7] mb-2">
              {t('taxId')}
            </label>
            <input
              type="text"
              placeholder={t('taxIdPlaceholder')}
              className="w-full bg-[#022820] border border-[rgba(16,185,129,0.2)] rounded-xl px-4 py-2.5 text-[#f0fdf4] placeholder-[#059669] focus:outline-none focus:border-[#10b981] transition-colors"
            />
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <button className="px-6 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-medium rounded-xl transition-colors">
              {t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
