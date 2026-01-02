'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Mail, Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

interface LoginFormProps {
  onSuccess?: () => void
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('auth.login')
  const router = useRouter()

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof Omit<LoginFormData, 'rememberMe'>, string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<LoginFormData, 'rememberMe'>, string>> = {}

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setGeneralError(null)

    try {
      // Sign in the user with BetterAuth
      await authClient.signIn.email(
        {
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        },
        {
          onSuccess: () => {
            if (onSuccess) {
              onSuccess()
            } else {
              router.push('/dashboard')
            }
          },
          onError: (ctx) => {
            setGeneralError(ctx.error.message)
          },
        }
      )
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : t('errors.generic'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field !== 'rememberMe' && errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {generalError && (
        <div className="p-4 rounded-xl bg-[#7f1d1d] border border-[#ef4444] text-[#fecaca]">
          {generalError}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#a7f3d0] mb-2">
          {t('form.email')}
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6ee7b7]" />
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('form.emailPlaceholder')}
            disabled={isLoading}
            autoComplete="email"
            className={`
              w-full pl-11 pr-4 py-3 rounded-xl
              bg-[#022c22] border
              ${errors.email ? 'border-[#ef4444]' : 'border-[rgba(16,185,129,0.2)]'}
              text-[#f0fdf4] placeholder:text-[#6ee7b7]/40
              focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-sm text-[#ef4444]">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#a7f3d0] mb-2">
          {t('form.password')}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6ee7b7]" />
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            placeholder={t('form.passwordPlaceholder')}
            disabled={isLoading}
            autoComplete="current-password"
            className={`
              w-full pl-11 pr-4 py-3 rounded-xl
              bg-[#022c22] border
              ${errors.password ? 'border-[#ef4444]' : 'border-[rgba(16,185,129,0.2)]'}
              text-[#f0fdf4] placeholder:text-[#6ee7b7]/40
              focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-[#ef4444]">{errors.password}</p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleChange('rememberMe', e.target.checked)}
            disabled={isLoading}
            className="
              w-4 h-4 rounded border-[rgba(16,185,129,0.3)]
              bg-[#022c22] text-[#10b981]
              focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
          <span className="ml-2 text-sm text-[#a7f3d0] group-hover:text-[#10b981] transition-colors">
            {t('form.rememberMe')}
          </span>
        </label>

        <button
          type="button"
          disabled={isLoading}
          className="text-sm text-[#10b981] hover:text-[#059669] transition-colors disabled:opacity-50"
        >
          {t('form.forgotPassword')}
        </button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="
          w-full py-3 px-4 rounded-xl font-semibold
          bg-gradient-to-br from-[#059669] to-[#0d9488]
          text-[#f0fdf4]
          hover:shadow-[0_0_30px_rgba(5,150,105,0.4)]
          hover:-translate-y-0.5
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
          transition-all duration-200
        "
      >
        {isLoading ? t('buttonLoading') : t('button')}
      </button>
    </form>
  )
}
