import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-[rgba(5,150,105,0.08)] border border-[rgba(16,185,129,0.15)] flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-[#10b981]" />
      </div>
      <h3 className="text-2xl font-semibold text-[#f0fdf4] mb-2">{title}</h3>
      <p className="text-[#6ee7b7] mb-8 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-gradient-to-br from-[#059669] to-[#0d9488] text-[#f0fdf4] rounded-[10px] font-medium transition-all duration-[150ms] hover:shadow-[0_0_20px_rgba(5,150,105,0.3)] hover:-translate-y-0.5"
        >
          {action.label}
        </button>
      )}
      {children}
    </div>
  )
}
