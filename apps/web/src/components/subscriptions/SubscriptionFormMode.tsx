'use client'

import { useState } from 'react'
import {
  Search,
  Package,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  User,
  FileText,
  ChevronDown,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { Subscription } from '@/lib/mockData'

interface SubscriptionFormModeProps {
  mode: 'create' | 'edit'
  subscription?: Subscription
  onSave?: (data: any) => void
}

export function SubscriptionFormMode({
  mode,
  subscription,
  onSave,
}: SubscriptionFormModeProps) {
  const t = useTranslations('subscriptions')
  const [pricingModel, setPricingModel] = useState('seat')
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'basic',
    'costs',
    'licenses',
    'renewal',
  ])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const toolSuggestions = [
    'Slack',
    'Notion',
    'Figma',
    'GitHub',
    'AWS',
    'HubSpot',
    'Zoom',
  ]

  return (
    <div className="px-6 py-6">
      {/* Tool Search (Only in create mode) */}
      {mode === 'create' && (
        <div className="mb-8">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6ee7b7]" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm placeholder:text-[#6ee7b7] focus:outline-none focus:border-[#059669] transition-all"
              placeholder={t('drawer.searchToolPlaceholder')}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {toolSuggestions.map((tool) => (
              <button
                key={tool}
                className="px-3 py-1.5 text-xs font-medium bg-[#033a2d] border border-[rgba(16,185,129,0.15)] text-[#a7f3d0] rounded-lg hover:border-[#059669] hover:bg-[rgba(5,150,105,0.08)] transition-all"
              >
                {tool}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Basic Info Section */}
      <FormSection
        icon={Package}
        title={t('drawer.form.basicInfo')}
        isExpanded={expandedSections.includes('basic')}
        onToggle={() => toggleSection('basic')}
      >
        <FormGroup label={t('drawer.form.toolName')} required>
          <input
            type="text"
            className="form-input"
            placeholder={t('drawer.form.toolNamePlaceholder')}
            defaultValue={subscription?.name}
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.vendor')}>
            <input
              type="text"
              className="form-input"
              placeholder={t('drawer.form.vendorPlaceholder')}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.website')}>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
            />
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.category')} required>
          <select className="form-select">
            <option>{t('drawer.form.selectCategory')}</option>
            <option>{t('categories.productivity')}</option>
            <option>{t('categories.infrastructure')}</option>
            <option>{t('categories.development')}</option>
            <option>{t('categories.design')}</option>
            <option>{t('categories.communication')}</option>
            <option>{t('categories.sales')}</option>
            <option>{t('categories.other')}</option>
          </select>
        </FormGroup>
      </FormSection>

      {/* Costs Section */}
      <FormSection
        icon={DollarSign}
        title={t('drawer.form.costsAndBilling')}
        isExpanded={expandedSections.includes('costs')}
        onToggle={() => toggleSection('costs')}
      >
        <FormGroup label={t('drawer.form.pricingModel')} required>
          <RadioGroup
            options={[
              { value: 'seat', label: t('drawer.form.perUserSeat') },
              { value: 'flat', label: t('drawer.form.flatRate') },
              { value: 'usage', label: t('drawer.form.perUsage') },
              { value: 'freemium', label: t('drawer.form.freemium') },
            ]}
            value={pricingModel}
            onChange={setPricingModel}
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.totalMonthlyCost')} required>
            <input
              type="text"
              className="form-input"
              placeholder="R$ 0,00"
              defaultValue={
                subscription
                  ? `R$ ${(subscription.monthlyCostCents / 100).toFixed(2)}`
                  : ''
              }
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.currency')}>
            <select className="form-select">
              <option>BRL 🇧🇷</option>
              <option>USD 🇺🇸</option>
              <option>EUR 🇪🇺</option>
            </select>
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.billingCycle')} required>
          <CheckboxRow
            options={[
              { value: 'monthly', label: t('billingCycles.monthly') },
              { value: 'annual', label: t('billingCycles.annual') },
              { value: 'quarterly', label: t('billingCycles.quarterly') },
            ]}
            defaultChecked={['annual']}
          />
        </FormGroup>
        <div className="p-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-xl text-sm text-[#6ee7b7]">
          💡 {t('drawer.form.annualCost')}: R$ 28.080,00
        </div>
      </FormSection>

      {/* Licenses Section */}
      <FormSection
        icon={Users}
        title={t('drawer.form.licensesAndUsers')}
        isExpanded={expandedSections.includes('licenses')}
        onToggle={() => toggleSection('licenses')}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.totalLicenses')}>
            <input
              type="number"
              className="form-input"
              placeholder="50"
              defaultValue={subscription?.totalSeats}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.pricePerLicense')}>
            <input
              type="text"
              className="form-input"
              value="R$ 46,80 (calculado)"
              disabled
              style={{ opacity: 0.7 }}
            />
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.licensesInUse')}>
          <input
            type="number"
            className="form-input"
            placeholder="42"
            defaultValue={subscription?.usedSeats}
          />
          <div className="mt-2 text-xs text-[#6ee7b7]">
            ℹ️ {t('drawer.form.autoUpdatedViaOkta')}
          </div>
        </FormGroup>
        <FormGroup label={t('drawer.form.licenseType')}>
          <select className="form-select">
            <option>{t('drawer.form.namedLicense')}</option>
            <option>{t('drawer.form.concurrentLicense')}</option>
            <option>{t('drawer.form.deviceLicense')}</option>
          </select>
        </FormGroup>
      </FormSection>

      {/* Renewal Section */}
      <FormSection
        icon={Calendar}
        title={t('drawer.form.renewalAndDates')}
        isExpanded={expandedSections.includes('renewal')}
        onToggle={() => toggleSection('renewal')}
      >
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.startDate')} required>
            <input type="date" className="form-input" />
          </FormGroup>
          <FormGroup label={t('drawer.form.renewalDate')} required>
            <input type="date" className="form-input" />
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.cancelDeadlineDate')}>
          <input type="date" className="form-input" />
          <div className="mt-2 text-xs text-[#6ee7b7]">
            ℹ️ {t('drawer.form.usually30DaysBefore')}
          </div>
        </FormGroup>
        <FormGroup label={t('drawer.form.remindBeforeRenewal')}>
          <CheckboxRow
            options={[
              { value: '30', label: t('drawer.form.days30') },
              { value: '15', label: t('drawer.form.days15') },
              { value: '7', label: t('drawer.form.days7') },
              { value: '1', label: t('drawer.form.days1') },
            ]}
            defaultChecked={['30', '15', '7']}
          />
        </FormGroup>
      </FormSection>

      {/* Payment Section */}
      <FormSection
        icon={CreditCard}
        title={t('drawer.form.payment')}
        isExpanded={expandedSections.includes('payment')}
        onToggle={() => toggleSection('payment')}
      >
        <FormGroup label={t('drawer.form.paymentMethod')}>
          <select className="form-select">
            <option>💳 {t('drawer.form.creditCard')}</option>
            <option>📄 {t('drawer.form.invoice')}</option>
            <option>🏦 {t('drawer.form.bankTransfer')}</option>
            <option>📱 PIX</option>
            <option>🅿️ PayPal</option>
          </select>
        </FormGroup>
        <FormGroup label={t('drawer.form.invoiceEmail')}>
          <input
            type="email"
            className="form-input"
            placeholder="financeiro@empresa.com"
          />
        </FormGroup>
        <FormGroup label={t('drawer.form.costCenterOptional')}>
          <input
            type="text"
            className="form-input"
            placeholder={t('drawer.form.costCenterPlaceholder')}
          />
        </FormGroup>
      </FormSection>

      {/* Responsible Section */}
      <FormSection
        icon={User}
        title={t('drawer.form.responsible')}
        isExpanded={expandedSections.includes('responsible')}
        onToggle={() => toggleSection('responsible')}
      >
        <FormGroup label={t('drawer.form.subscriptionOwner')} required>
          <select className="form-select">
            <option>{t('drawer.form.selectResponsible')}</option>
            <option>👤 Maria Santos (TI)</option>
            <option>👤 João Silva (Produto)</option>
            <option>👤 Ana Costa (Financeiro)</option>
          </select>
        </FormGroup>
        <FormGroup label={t('drawer.form.department')}>
          <select className="form-select">
            <option>🏢 Tecnologia</option>
            <option>🏢 Produto</option>
            <option>🏢 Marketing</option>
            <option>🏢 Vendas</option>
            <option>🏢 Financeiro</option>
          </select>
        </FormGroup>
      </FormSection>

      {/* Notes Section */}
      <FormSection
        icon={FileText}
        title={t('drawer.form.notesAndDocuments')}
        isExpanded={expandedSections.includes('notes')}
        onToggle={() => toggleSection('notes')}
      >
        <FormGroup label={t('drawer.form.internalNotes')}>
          <textarea
            className="w-full px-4 py-2.5 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl text-[#f0fdf4] text-sm placeholder:text-[#6ee7b7] focus:outline-none focus:border-[#059669] transition-all resize-none"
            rows={4}
            placeholder={t('drawer.form.notesPlaceholder')}
          />
        </FormGroup>
      </FormSection>

      {/* Footer Actions */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-[#022c22] border-t border-[rgba(16,185,129,0.15)] mt-8">
        <div className="flex justify-end gap-3">
          <button className="px-4 py-2.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-xl hover:bg-[rgba(5,150,105,0.08)] transition-all">
            {t('drawer.form.cancel')}
          </button>
          <button
            onClick={() => onSave?.({})}
            className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-xl hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all"
          >
            {t('drawer.form.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

function FormSection({
  icon: Icon,
  title,
  isExpanded,
  onToggle,
  children,
}: {
  icon: any
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-xl hover:border-[rgba(16,185,129,0.3)] transition-colors mb-3"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[#f0fdf4]">
          <Icon className="w-4 h-4 text-[#10b981]" />
          {title}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#6ee7b7] transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && <div className="space-y-4">{children}</div>}
    </div>
  )
}

function FormGroup({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#6ee7b7] mb-2">
        {label}
        {required && <span className="text-[#ef4444] ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full flex items-center gap-3 p-3 border rounded-xl transition-all ${
            value === option.value
              ? 'bg-[rgba(5,150,105,0.08)] border-[#059669]'
              : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] hover:border-[rgba(16,185,129,0.3)]'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              value === option.value
                ? 'border-[#059669]'
                : 'border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {value === option.value && (
              <div className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
            )}
          </div>
          <span className="text-sm text-[#f0fdf4]">{option.label}</span>
        </button>
      ))}
    </div>
  )
}

function CheckboxRow({
  options,
  defaultChecked = [],
}: {
  options: { value: string; label: string }[]
  defaultChecked?: string[]
}) {
  const [checked, setChecked] = useState<string[]>(defaultChecked)

  const toggle = (value: string) => {
    setChecked((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => toggle(option.value)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
            checked.includes(option.value)
              ? 'bg-[rgba(5,150,105,0.08)] border-[#059669]'
              : 'bg-[#033a2d] border-[rgba(16,185,129,0.15)] hover:border-[rgba(16,185,129,0.3)]'
          }`}
        >
          <div
            className={`w-4 h-4 rounded border flex items-center justify-center ${
              checked.includes(option.value)
                ? 'bg-[#059669] border-[#059669]'
                : 'border-[rgba(16,185,129,0.3)]'
            }`}
          >
            {checked.includes(option.value) && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-sm text-[#f0fdf4]">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
