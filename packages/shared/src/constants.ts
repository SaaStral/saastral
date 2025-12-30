/**
 * Application-wide constants
 */

export const APP_NAME = 'SaaStral'
export const APP_VERSION = '0.1.0'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export const DATE_FORMAT = 'yyyy-MM-dd'
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss'

export const SUPPORTED_CURRENCIES = ['BRL', 'USD', 'EUR'] as const
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]

export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'one-time'] as const
export type BillingCycle = (typeof BILLING_CYCLES)[number]
