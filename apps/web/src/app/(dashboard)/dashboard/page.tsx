'use client'

import { LayoutDashboard } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DashboardPage() {
  return (
    <div>
      <EmptyState
        icon={LayoutDashboard}
        title="Dashboard em Construção"
        description="Aqui você verá o resumo completo de seus gastos com SaaS, alertas importantes e insights de economia."
        action={{
          label: 'Explorar Funcionalidades',
          onClick: () => console.log('Explore features'),
        }}
      >
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">0</div>
            <div className="text-sm text-[#6ee7b7]">Total de Assinaturas</div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">R$ 0</div>
            <div className="text-sm text-[#6ee7b7]">Gasto Mensal</div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-2xl font-bold text-[#f0fdf4] mb-1">0</div>
            <div className="text-sm text-[#6ee7b7]">Alertas Ativos</div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
