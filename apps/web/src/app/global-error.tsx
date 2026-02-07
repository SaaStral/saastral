'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  // Note: global-error.tsx doesn't have access to useTranslations
  // We need to provide default English text here
  // For a production app, you could detect locale from error.digest or browser settings

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-[#001a14] flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-red-500/10 p-6">
                <svg
                  className="w-16 h-16 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#f0fdf4] mb-3">
              Application Error
            </h1>
            <p className="text-[#6ee7b7] mb-8">
              A critical error occurred. Please try reloading the page.
            </p>

            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#10b981] text-[#001a14] rounded-lg font-medium hover:bg-[#059669] transition-colors"
            >
              Reload Application
            </button>

            <p className="mt-8 text-sm text-[#6ee7b7]/60">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
