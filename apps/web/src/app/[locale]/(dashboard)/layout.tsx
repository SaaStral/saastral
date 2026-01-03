import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { OrganizationProvider } from '@/contexts/OrganizationContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </OrganizationProvider>
  )
}
