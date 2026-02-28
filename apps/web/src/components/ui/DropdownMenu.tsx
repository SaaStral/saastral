'use client'

import { useState, useRef, useEffect } from 'react'

interface DropdownMenuItem {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownMenuItem[]
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  if (items.length === 0) return <>{trigger}</>

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[#022c22] border border-[rgba(16,185,129,0.2)] rounded-lg shadow-lg py-1">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                item.variant === 'danger'
                  ? 'text-[#ef4444] hover:bg-[rgba(239,68,68,0.1)]'
                  : 'text-[#a7f3d0] hover:bg-[rgba(5,150,105,0.15)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
