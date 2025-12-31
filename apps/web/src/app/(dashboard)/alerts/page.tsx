'use client'

import { Bell } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function AlertsPage() {
  return (
    <div>
      <EmptyState
        icon={Bell}
        title="Central de Alertas"
        description="Receba notificações inteligentes sobre offboarding, renovações próximas, licenças não utilizadas e oportunidades de economia."
      >
        <div className="mt-8 grid grid-cols-2 gap-3 max-w-xl text-sm">
          <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span className="text-[#f0fdf4]">Offboarding Pendente</span>
          </div>
          <div className="p-3 bg-[rgba(249,115,22,0.1)] border border-[rgba(249,115,22,0.3)] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span className="text-[#f0fdf4]">Renovação Próxima</span>
          </div>
          <div className="p-3 bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            <span className="text-[#f0fdf4]">Licenças Não Utilizadas</span>
          </div>
          <div className="p-3 bg-[rgba(59,130,246,0.1)] border border-[rgba(59,130,246,0.3)] rounded-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-[#f0fdf4]">Baixa Adoção</span>
          </div>
        </div>
        <div className="mt-6 text-sm text-[#6ee7b7]">
          Configure integrações para começar a receber alertas automáticos
        </div>
      </EmptyState>
    </div>
  )
}
