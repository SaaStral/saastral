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
  Loader2,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { SubscriptionDisplay } from '@/lib/subscription-helpers'

interface SubscriptionFormModeProps {
  mode: 'create' | 'edit'
  subscription?: SubscriptionDisplay
  onSave?: (data: any) => void
  isSaving?: boolean
}

interface FormData {
  name: string
  vendor: string
  website: string
  category: string
  billingCycle: string
  pricingModel: string
  totalMonthlyCost: string
  currency: string
  totalSeats: string
  usedSeats: string
  licenseType: string
  startDate: string
  renewalDate: string
  cancellationDeadline: string
  paymentMethod: string
  billingEmail: string
  costCenter: string
  notes: string
  autoRenew: boolean
}

const CATEGORY_VALUES = [
  'productivity',
  'development',
  'design',
  'infrastructure',
  'sales_marketing',
  'communication',
  'finance',
  'hr',
  'security',
  'analytics',
  'support',
  'other',
] as const

export function SubscriptionFormMode({
  mode,
  subscription,
  onSave,
  isSaving,
}: SubscriptionFormModeProps) {
  const t = useTranslations('subscriptions')
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'basic',
    'costs',
    'licenses',
    'renewal',
  ])

  const [form, setForm] = useState<FormData>({
    name: subscription?.name ?? '',
    vendor: '',
    website: '',
    category: subscription?.category ?? '',
    billingCycle: 'annual',
    pricingModel: 'per_seat',
    totalMonthlyCost: subscription ? (subscription.monthlyCostCents / 100).toFixed(2) : '',
    currency: 'BRL',
    totalSeats: subscription?.totalSeats?.toString() ?? '',
    usedSeats: subscription?.usedSeats?.toString() ?? '',
    licenseType: 'named',
    startDate: '',
    renewalDate: '',
    cancellationDeadline: '',
    paymentMethod: 'credit_card',
    billingEmail: '',
    costCenter: '',
    notes: '',
    autoRenew: true,
  })

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    )
  }

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.totalMonthlyCost || !form.startDate || !form.renewalDate) return

    const costInCents = Math.round(parseFloat(form.totalMonthlyCost.replace(',', '.')) * 100)

    onSave?.({
      name: form.name,
      vendor: form.vendor || undefined,
      website: form.website || undefined,
      category: form.category,
      billingCycle: form.billingCycle,
      pricingModel: form.pricingModel,
      totalMonthlyCost: costInCents,
      currency: form.currency,
      totalSeats: form.totalSeats ? parseInt(form.totalSeats, 10) : undefined,
      licenseType: form.licenseType || undefined,
      startDate: new Date(form.startDate).toISOString(),
      renewalDate: new Date(form.renewalDate).toISOString(),
      cancellationDeadline: form.cancellationDeadline ? new Date(form.cancellationDeadline).toISOString() : undefined,
      paymentMethod: form.paymentMethod || undefined,
      billingEmail: form.billingEmail || undefined,
      costCenter: form.costCenter || undefined,
      autoRenew: form.autoRenew,
      notes: form.notes || undefined,
    })
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
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {toolSuggestions.map((tool) => (
              <button
                key={tool}
                onClick={() => updateField('name', tool)}
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
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.vendor')}>
            <input
              type="text"
              className="form-input"
              placeholder={t('drawer.form.vendorPlaceholder')}
              value={form.vendor}
              onChange={(e) => updateField('vendor', e.target.value)}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.website')}>
            <input
              type="text"
              className="form-input"
              placeholder="https://..."
              value={form.website}
              onChange={(e) => updateField('website', e.target.value)}
            />
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.category')} required>
          <select
            className="form-select"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
          >
            <option value="">{t('drawer.form.selectCategory')}</option>
            {CATEGORY_VALUES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${cat}`)}
              </option>
            ))}
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
              { value: 'per_seat', label: t('drawer.form.perUserSeat') },
              { value: 'flat_rate', label: t('drawer.form.flatRate') },
              { value: 'usage_based', label: t('drawer.form.perUsage') },
              { value: 'freemium', label: t('drawer.form.freemium') },
            ]}
            value={form.pricingModel}
            onChange={(v) => updateField('pricingModel', v)}
          />
        </FormGroup>
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label={t('drawer.form.totalMonthlyCost')} required>
            <input
              type="text"
              className="form-input"
              placeholder="R$ 0,00"
              value={form.totalMonthlyCost}
              onChange={(e) => updateField('totalMonthlyCost', e.target.value)}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.currency')}>
            <select
              className="form-select"
              value={form.currency}
              onChange={(e) => updateField('currency', e.target.value)}
            >
              <option value="BRL">BRL 🇧🇷</option>
              <option value="USD">USD 🇺🇸</option>
              <option value="EUR">EUR 🇪🇺</option>
            </select>
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.billingCycle')} required>
          <RadioGroup
            options={[
              { value: 'monthly', label: t('billingCycles.monthly') },
              { value: 'annual', label: t('billingCycles.annual') },
              { value: 'quarterly', label: t('billingCycles.quarterly') },
            ]}
            value={form.billingCycle}
            onChange={(v) => updateField('billingCycle', v)}
          />
        </FormGroup>
        {form.totalMonthlyCost && (
          <div className="p-3 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-xl text-sm text-[#6ee7b7]">
            💡 {t('drawer.form.annualCost')}: R$ {(parseFloat(form.totalMonthlyCost.replace(',', '.') || '0') * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        )}
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
              value={form.totalSeats}
              onChange={(e) => updateField('totalSeats', e.target.value)}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.pricePerLicense')}>
            <input
              type="text"
              className="form-input"
              value={
                form.totalMonthlyCost && form.totalSeats
                  ? `R$ ${(parseFloat(form.totalMonthlyCost.replace(',', '.')) / parseInt(form.totalSeats)).toFixed(2)}`
                  : ''
              }
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
            value={form.usedSeats}
            onChange={(e) => updateField('usedSeats', e.target.value)}
          />
          <div className="mt-2 text-xs text-[#6ee7b7]">
            ℹ️ {t('drawer.form.autoUpdatedViaOkta')}
          </div>
        </FormGroup>
        <FormGroup label={t('drawer.form.licenseType')}>
          <select
            className="form-select"
            value={form.licenseType}
            onChange={(e) => updateField('licenseType', e.target.value)}
          >
            <option value="named">{t('drawer.form.namedLicense')}</option>
            <option value="concurrent">{t('drawer.form.concurrentLicense')}</option>
            <option value="floating">{t('drawer.form.deviceLicense')}</option>
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
            <input
              type="date"
              className="form-input"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
            />
          </FormGroup>
          <FormGroup label={t('drawer.form.renewalDate')} required>
            <input
              type="date"
              className="form-input"
              value={form.renewalDate}
              onChange={(e) => updateField('renewalDate', e.target.value)}
            />
          </FormGroup>
        </div>
        <FormGroup label={t('drawer.form.cancelDeadlineDate')}>
          <input
            type="date"
            className="form-input"
            value={form.cancellationDeadline}
            onChange={(e) => updateField('cancellationDeadline', e.target.value)}
          />
          <div className="mt-2 text-xs text-[#6ee7b7]">
            ℹ️ {t('drawer.form.usually30DaysBefore')}
          </div>
        </FormGroup>
        <FormGroup label={t('drawer.form.autoRenew')}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => updateField('autoRenew', !form.autoRenew)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                form.autoRenew ? 'bg-[#059669]' : 'bg-[#033a2d] border border-[rgba(16,185,129,0.3)]'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.autoRenew ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm text-[#f0fdf4]">
              {form.autoRenew ? t('drawer.form.yes') : t('drawer.form.no')}
            </span>
          </label>
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
          <select
            className="form-select"
            value={form.paymentMethod}
            onChange={(e) => updateField('paymentMethod', e.target.value)}
          >
            <option value="credit_card">💳 {t('drawer.form.creditCard')}</option>
            <option value="invoice">📄 {t('drawer.form.invoice')}</option>
            <option value="bank_transfer">🏦 {t('drawer.form.bankTransfer')}</option>
            <option value="pix">📱 PIX</option>
            <option value="paypal">🅿️ PayPal</option>
          </select>
        </FormGroup>
        <FormGroup label={t('drawer.form.invoiceEmail')}>
          <input
            type="email"
            className="form-input"
            placeholder="financeiro@empresa.com"
            value={form.billingEmail}
            onChange={(e) => updateField('billingEmail', e.target.value)}
          />
        </FormGroup>
        <FormGroup label={t('drawer.form.costCenterOptional')}>
          <input
            type="text"
            className="form-input"
            placeholder={t('drawer.form.costCenterPlaceholder')}
            value={form.costCenter}
            onChange={(e) => updateField('costCenter', e.target.value)}
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
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </FormGroup>
      </FormSection>

      {/* Footer Actions */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-[#022c22] border-t border-[rgba(16,185,129,0.15)] mt-8">
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2.5 text-sm font-semibold text-[#a7f3d0] border border-[rgba(16,185,129,0.15)] rounded-xl hover:bg-[rgba(5,150,105,0.08)] transition-all"
            disabled={isSaving}
          >
            {t('drawer.form.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !form.name || !form.category || !form.totalMonthlyCost || !form.startDate || !form.renewalDate}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#059669] to-[#0d9488] rounded-xl hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
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

