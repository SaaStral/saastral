'use client'

import { Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function SubscriptionsPage() {
  return (
    <div>
      <EmptyState
        icon={Package}
        title="Gerencie suas Assinaturas"
        description="Controle todas as ferramentas SaaS da sua empresa, custos, licenças e renovações em um só lugar."
        action={{
          label: 'Adicionar Assinatura',
          onClick: () => console.log('Add subscription'),
        }}
      >
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-lg">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-sm text-[#6ee7b7] mb-2">Categorias suportadas</div>
            <div className="text-xs text-[#4ade80]">
              Comunicação • Produtividade • Design • Desenvolvimento • Marketing
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-sm text-[#6ee7b7] mb-2">Rastreamento automático</div>
            <div className="text-xs text-[#4ade80]">
              Custos • Licenças • Renovações • Uso • Economia
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
