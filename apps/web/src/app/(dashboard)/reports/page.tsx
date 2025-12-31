'use client'

import { FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ReportsPage() {
  return (
    <div>
      <EmptyState
        icon={FileText}
        title="Relatórios e Analytics"
        description="Analise seus gastos com SaaS, identifique tendências, compare departamentos e encontre oportunidades de economia."
      >
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-3xl text-sm">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📊 Gasto por Categoria</div>
            <div className="text-xs text-[#6ee7b7]">
              Visualize onde seu dinheiro está sendo investido
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📈 Tendências Mensais</div>
            <div className="text-xs text-[#6ee7b7]">
              Acompanhe a evolução dos seus gastos
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">💰 Economia Potencial</div>
            <div className="text-xs text-[#6ee7b7]">
              Identifique onde você pode economizar
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">👥 Por Departamento</div>
            <div className="text-xs text-[#6ee7b7]">
              Compare gastos entre diferentes áreas
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">📅 Renovações Futuras</div>
            <div className="text-xs text-[#6ee7b7]">
              Planeje-se para os próximos meses
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg">
            <div className="text-[#10b981] font-semibold mb-2">🎯 Taxa de Utilização</div>
            <div className="text-xs text-[#6ee7b7]">
              Veja quantas licenças estão em uso
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
