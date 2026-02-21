/**
 * Helpers for mapping backend subscription types to frontend display types.
 */

// ============================================================================
// Display Types (used by components)
// ============================================================================

export interface SubscriptionIcon {
  text: string
  gradient: { from: string; to: string }
  textColor: string
}

export type DisplayStatus = 'active' | 'warning' | 'critical'

export interface SubscriptionDisplay {
  id: string
  name: string
  category: string
  monthlyCostCents: number
  totalSeats: number
  usedSeats: number
  adoptionRate: number
  renewalDate: string
  daysUntilRenewal: number
  status: DisplayStatus
  icon: SubscriptionIcon
}

export interface RenewalDisplay {
  id: string
  name: string
  monthlyCostCents: number
  renewalDate: string
  daysUntilRenewal: number
  icon: string
  color: string
}

export interface CategorySpendingDisplay {
  category: string
  amount: number
  color: string
}

// ============================================================================
// Category Gradients & Colors
// ============================================================================

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  productivity: { from: '#3b82f6', to: '#2563eb' },
  development: { from: '#8b5cf6', to: '#7c3aed' },
  design: { from: '#ec4899', to: '#db2777' },
  infrastructure: { from: '#f97316', to: '#ea580c' },
  sales_marketing: { from: '#14b8a6', to: '#0d9488' },
  communication: { from: '#06b6d4', to: '#0891b2' },
  finance: { from: '#84cc16', to: '#65a30d' },
  hr: { from: '#eab308', to: '#ca8a04' },
  security: { from: '#ef4444', to: '#dc2626' },
  analytics: { from: '#6366f1', to: '#4f46e5' },
  support: { from: '#22c55e', to: '#16a34a' },
  other: { from: '#6b7280', to: '#4b5563' },
}

function getGradientForCategory(category: string): { from: string; to: string } {
  return CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.other!
}

// ============================================================================
// Icon Generation
// ============================================================================

export function generateIcon(name: string, category: string): SubscriptionIcon {
  const gradient = getGradientForCategory(category)
  return {
    text: name.charAt(0).toUpperCase(),
    gradient,
    textColor: '#fff',
  }
}

// ============================================================================
// Status Mapping
// ============================================================================

function mapStatus(
  backendStatus: string,
  usagePercentage?: number,
): DisplayStatus {
  if (backendStatus === 'suspended' || backendStatus === 'cancelled' || backendStatus === 'expired') {
    return 'critical'
  }
  if (backendStatus === 'trial') {
    return 'warning'
  }
  // active status — check usage
  if (usagePercentage !== undefined && usagePercentage < 50) {
    return 'warning'
  }
  return 'active'
}

// ============================================================================
// Mappers
// ============================================================================

export function toSubscriptionDisplay(item: {
  id: string
  name: string
  category: string
  logoUrl?: string | null
  status: string
  totalMonthlyCost: number
  totalSeats?: number | null
  usedSeats: number
  seatsUnlimited: boolean
  usagePercentage?: number | null
  renewalDate: string
  daysUntilRenewal: number
}): SubscriptionDisplay {
  const totalSeats = item.seatsUnlimited ? item.usedSeats : (item.totalSeats ?? item.usedSeats)
  const adoptionRate = totalSeats > 0 ? (item.usedSeats / totalSeats) * 100 : 0

  return {
    id: item.id,
    name: item.name,
    category: item.category,
    monthlyCostCents: item.totalMonthlyCost,
    totalSeats,
    usedSeats: item.usedSeats,
    adoptionRate: item.usagePercentage ?? adoptionRate,
    renewalDate: formatDateShort(item.renewalDate),
    daysUntilRenewal: item.daysUntilRenewal,
    status: mapStatus(item.status, item.usagePercentage ?? undefined),
    icon: generateIcon(item.name, item.category),
  }
}

export function toRenewalDisplay(item: {
  id: string
  name: string
  logoUrl?: string | null
  renewalDate: string
  daysUntilRenewal: number
  totalMonthlyCost: number
}): RenewalDisplay {
  const gradient = getGradientForCategory('other') // renewals don't carry category
  return {
    id: item.id,
    name: item.name,
    monthlyCostCents: item.totalMonthlyCost,
    renewalDate: formatDateShort(item.renewalDate),
    daysUntilRenewal: item.daysUntilRenewal,
    icon: item.name.charAt(0).toUpperCase(),
    color: gradient.from,
  }
}

export function toCategorySpendingDisplay(item: {
  category: string
  monthlyCost: number
  color: string
}): CategorySpendingDisplay {
  return {
    category: item.category,
    amount: item.monthlyCost,
    color: item.color,
  }
}

// ============================================================================
// Formatting
// ============================================================================

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
