'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface OrganizationContextType {
  selectedOrgId: string | null
  setSelectedOrgId: (orgId: string) => void
  clearSelectedOrg: () => void
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

const STORAGE_KEY = 'saastral:selectedOrganizationId'

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [selectedOrgId, setSelectedOrgIdState] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedOrgIdState(stored)
    }
  }, [])

  const setSelectedOrgId = (orgId: string) => {
    setSelectedOrgIdState(orgId)
    localStorage.setItem(STORAGE_KEY, orgId)
  }

  const clearSelectedOrg = () => {
    setSelectedOrgIdState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <OrganizationContext.Provider value={{ selectedOrgId, setSelectedOrgId, clearSelectedOrg }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
