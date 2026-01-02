'use client'

interface AuthModeToggleProps {
  hasExistingUsers: boolean
  onToggle: () => void
}

export function AuthModeToggle({ hasExistingUsers, onToggle }: AuthModeToggleProps) {
  return (
    <div className="mt-6 text-center">
      <button
        onClick={onToggle}
        className="text-sm text-[#6ee7b7] hover:text-[#10b981] transition-colors underline"
      >
        {hasExistingUsers
          ? 'Switch to Signup (Dev Mode)'
          : 'Switch to Login (Dev Mode)'}
      </button>
    </div>
  )
}
