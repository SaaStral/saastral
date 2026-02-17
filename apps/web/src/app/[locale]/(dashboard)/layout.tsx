import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { OrganizationProvider } from '@/contexts/OrganizationContext'

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  // Validate session using better-auth
  // This runs in Node.js runtime (server component) so it can access pg module
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  // Redirect to auth page if no valid session
  if (!session || !session.user) {
    const { locale } = await params
    redirect(`/${locale}/auth`)
  }

  return (
    <OrganizationProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </OrganizationProvider>
  )
}
