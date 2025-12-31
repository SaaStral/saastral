import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 p-8 w-full">
          <div className="max-w-[1600px] w-full mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
