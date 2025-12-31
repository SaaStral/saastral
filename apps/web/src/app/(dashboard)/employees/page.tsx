'use client'

import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function EmployeesPage() {
  return (
    <div>
      <EmptyState
        icon={Users}
        title="Gerencie sua Equipe"
        description="Aqui você poderá visualizar todos os funcionários, suas licenças ativas e detectar automaticamente quando alguém sai da empresa."
        action={{
          label: 'Adicionar Funcionário',
          onClick: () => console.log('Add employee'),
        }}
      >
        <div className="mt-8 text-sm text-[#6ee7b7] max-w-md">
          <p>Conecte o Google Workspace para sincronizar automaticamente seus funcionários.</p>
        </div>
      </EmptyState>
    </div>
  )
}
