'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Building2, User, Mail, Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

interface SignupFormProps {
  onSuccess?: () => void
}

export interface SignupFormData {
  organizationName: string
  fullName: string
  email: string
  password: string
  confirmPassword: string
}

export function SignupForm({ onSuccess }: SignupFormProps) {
  const t = useTranslations('auth.signup')
  const locale = useLocale()
  const router = useRouter()

  const [formData, setFormData] = useState<SignupFormData>({
    organizationName: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState<Partial<Record<keyof SignupFormData, string>>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  // tRPC mutation for creating organization
  const createOrganization = trpc.organization.create.useMutation()

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SignupFormData, string>> = {}

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = t('validation.organizationNameRequired')
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = t('validation.fullNameRequired')
    }

    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validation.emailInvalid')
    }

    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired')
    } else if (formData.password.length < 8) {
      newErrors.password = t('validation.passwordMinLength')
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMatch')
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
      // Sign up the user with BetterAuth
      await authClient.signUp.email(
        {
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
        },
        {
          onSuccess: async (ctx) => {
            // Create organization for the new user
            try {
              await createOrganization.mutateAsync({
                name: formData.organizationName,
                userId: ctx.data.user.id,
              })

              // Redirect to dashboard after successful organization creation
              if (onSuccess) {
                onSuccess()
              } else {
                router.push(`/${locale}/dashboard`)
              }
            } catch (orgError) {
              setGeneralError(
                orgError instanceof Error
                  ? orgError.message
                  : 'Failed to create organization'
              )
              setIsLoading(false)
            }
          },
          onError: (ctx) => {
            setGeneralError(ctx.error.message)
            setIsLoading(false)
          },
        }
      )
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : t('errors.generic'))
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof SignupFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
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

      {/* Organization Section */}
      <div>
        <h3 className="text-sm font-semibold text-[#10b981] mb-4 uppercase tracking-wider">
          {t('organizationSection')}
        </h3>
        <div>
          <label htmlFor="organizationName" className="block text-sm font-medium text-[#a7f3d0] mb-2">
            {t('form.organizationName')}
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6ee7b7]" />
            <input
              id="organizationName"
              type="text"
              value={formData.organizationName}
              onChange={(e) => handleChange('organizationName', e.target.value)}
              placeholder={t('form.organizationNamePlaceholder')}
              disabled={isLoading}
              className={`
                w-full pl-11 pr-4 py-3 rounded-xl
                bg-[#022c22] border
                ${errors.organizationName ? 'border-[#ef4444]' : 'border-[rgba(16,185,129,0.2)]'}
                text-[#f0fdf4] placeholder:text-[#6ee7b7]/40
                focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          </div>
          {errors.organizationName && (
            <p className="mt-1 text-sm text-[#ef4444]">{errors.organizationName}</p>
          )}
        </div>
      </div>

      {/* Admin Section */}
      <div>
        <h3 className="text-sm font-semibold text-[#10b981] mb-4 uppercase tracking-wider">
          {t('adminSection')}
        </h3>
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-[#a7f3d0] mb-2">
              {t('form.fullName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6ee7b7]" />
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder={t('form.fullNamePlaceholder')}
                disabled={isLoading}
                className={`
                  w-full pl-11 pr-4 py-3 rounded-xl
                  bg-[#022c22] border
                  ${errors.fullName ? 'border-[#ef4444]' : 'border-[rgba(16,185,129,0.2)]'}
                  text-[#f0fdf4] placeholder:text-[#6ee7b7]/40
                  focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.fullName}</p>
            )}
          </div>

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

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#a7f3d0] mb-2">
              {t('form.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6ee7b7]" />
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder={t('form.confirmPasswordPlaceholder')}
                disabled={isLoading}
                className={`
                  w-full pl-11 pr-4 py-3 rounded-xl
                  bg-[#022c22] border
                  ${errors.confirmPassword ? 'border-[#ef4444]' : 'border-[rgba(16,185,129,0.2)]'}
                  text-[#f0fdf4] placeholder:text-[#6ee7b7]/40
                  focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[rgba(16,185,129,0.2)]
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-[#ef4444]">{errors.confirmPassword}</p>
            )}
          </div>
        </div>
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
