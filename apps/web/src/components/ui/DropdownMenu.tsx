'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  const close = useCallback(() => {
    setOpen(false)
    setFocusedIndex(-1)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close()
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, close])

  useEffect(() => {
    if (open && focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.focus()
    }
  }, [open, focusedIndex])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setFocusedIndex(0)
      }
      return
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((i) => (i + 1) % items.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((i) => (i - 1 + items.length) % items.length)
        break
      case 'Home':
        e.preventDefault()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        setFocusedIndex(items.length - 1)
        break
    }
  }

  if (items.length === 0) return <>{trigger}</>

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <div
        onClick={() => {
          setOpen((v) => !v)
          if (!open) setFocusedIndex(0)
        }}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        tabIndex={0}
      >
        {trigger}
      </div>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-[#022c22] border border-[rgba(16,185,129,0.2)] rounded-lg shadow-lg py-1"
        >
          {items.map((item, i) => (
            <button
              key={i}
              ref={(el) => { itemRefs.current[i] = el }}
              role="menuitem"
              tabIndex={focusedIndex === i ? 0 : -1}
              onClick={() => {
                close()
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
