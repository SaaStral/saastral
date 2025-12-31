'use client'

import { Settings as SettingsIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

export default function SettingsPage() {
  return (
    <div>
      <EmptyState
        icon={SettingsIcon}
        title="Configurações"
        description="Configure suas integrações, notificações, usuários e preferências do sistema."
      >
        <div className="mt-8 grid grid-cols-2 gap-4 max-w-2xl text-sm">
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">🔗 Integrações</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Google Workspace • Okta • Microsoft 365 • Keycloak
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
              <span className="text-xs text-[#a7f3d0]">2 ativas</span>
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">🔔 Notificações</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Email • Slack • Teams • Webhooks
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#6b7280]" />
              <span className="text-xs text-[#a7f3d0]">Não configurado</span>
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">👤 Usuários e Permissões</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Gerencie quem tem acesso ao SaaStral
            </div>
          </div>
          <div className="p-4 bg-[#033a2d] border border-[rgba(16,185,129,0.15)] rounded-lg text-left">
            <div className="text-[#10b981] font-semibold mb-2">⚙️ Preferências</div>
            <div className="text-xs text-[#6ee7b7] mb-3">
              Idioma • Timezone • Moeda • Formato de data
            </div>
          </div>
        </div>
      </EmptyState>
    </div>
  )
}
