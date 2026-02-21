'use client'

import { X, ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { SubscriptionDisplay } from '@/lib/subscription-helpers'
import { SubscriptionViewMode } from './SubscriptionViewMode'
import { SubscriptionFormMode } from './SubscriptionFormMode'

export type DrawerMode = 'view' | 'create' | 'edit' | null

interface SubscriptionDrawerProps {
  mode: DrawerMode
  subscription?: SubscriptionDisplay
  onClose: () => void
  onSave?: (data: any) => void
  isSaving?: boolean
}

export function SubscriptionDrawer({
  mode,
  subscription,
  onClose,
  onSave,
  isSaving,
}: SubscriptionDrawerProps) {
  const t = useTranslations('subscriptions')

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mode, onClose])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mode) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mode])

  if (!mode) return null

  const isView = mode === 'view'
  const isCreate = mode === 'create'

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#022c22] border-l border-[rgba(16,185,129,0.15)] z-50 flex flex-col transform transition-transform duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(16,185,129,0.15)]">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-[#6ee7b7] hover:text-[#f0fdf4] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm font-medium">{t('drawer.back')}</span>
          </button>

          {isCreate && (
            <h2 className="absolute left-1/2 -translate-x-1/2 font-sora text-lg font-semibold text-[#f0fdf4]">
              {t('drawer.newSubscription')}
            </h2>
          )}

          <button
            onClick={onClose}
            className="p-2 text-[#6ee7b7] hover:text-[#f0fdf4] hover:bg-[rgba(5,150,105,0.08)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isView && subscription ? (
            <SubscriptionViewMode subscription={subscription} onEdit={() => {}} />
          ) : (
            <SubscriptionFormMode
              mode={mode as 'create' | 'edit'}
              subscription={subscription}
              onSave={onSave}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </>
  )
}
