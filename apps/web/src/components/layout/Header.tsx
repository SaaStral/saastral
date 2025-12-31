'use client'

import { Search, Bell, HelpCircle } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 bg-[rgba(2,44,34,0.8)] backdrop-blur-[12px] border-b border-[rgba(16,185,129,0.15)] flex items-center justify-between px-8 sticky top-0 z-50">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-['Sora',sans-serif] text-xl font-semibold">Dashboard</h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button className="flex items-center gap-2.5 px-4 py-2 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-[10px] text-[#6ee7b7] text-sm cursor-pointer transition-all duration-[150ms] hover:border-[rgba(16,185,129,0.3)] hover:bg-[#044d3a]">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
          <span className="bg-[#022c22] px-2 py-0.5 rounded text-[0.75rem] font-['JetBrains_Mono',monospace]">
            ⌘K
          </span>
        </button>

        {/* Help Button */}
        <button className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-transparent border border-transparent text-[#a7f3d0] cursor-pointer transition-all duration-[150ms] hover:bg-[#033a2d] hover:border-[rgba(16,185,129,0.15)]">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-transparent border border-transparent text-[#a7f3d0] cursor-pointer transition-all duration-[150ms] relative hover:bg-[#033a2d] hover:border-[rgba(16,185,129,0.15)]">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ef4444] rounded-full border-2 border-[#022c22]" />
        </button>

        {/* User Avatar */}
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-[#059669] to-[#0d9488] flex items-center justify-center font-semibold text-sm cursor-pointer transition-transform duration-[150ms] hover:scale-105">
          CF
        </button>
      </div>
    </header>
  )
}
