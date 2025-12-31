// Mock data for dashboard - to be replaced with real API calls later

export interface KPIData {
  totalMonthlyCost: number // in cents
  costTrend: number // percentage
  potentialSavings: number // in cents
  savingsOpportunities: number
  activeEmployees: number
  pendingOffboardings: number
  trackedSubscriptions: number
  ssoConnectedSubscriptions: number
}

export interface ChartDataPoint {
  date: string
  productivity: number
  design: number
  development: number
  salesMarketing: number
  infrastructure: number
}

export interface Alert {
  id: string
  type: 'offboarding' | 'renewal' | 'unused' | 'adoption' | 'duplicate'
  severity: 'high' | 'medium' | 'low'
  title: string
  subtitle: string
  actionLabel: string
  timestamp: string
}

export interface Subscription {
  id: string
  name: string
  category: 'productivity' | 'design' | 'development' | 'sales' | 'infrastructure' | 'video'
  monthlyCostCents: number
  totalSeats: number
  usedSeats: number
  adoptionRate: number
  renewalDate: string
  daysUntilRenewal: number
  status: 'active' | 'warning' | 'critical'
  icon: {
    text: string
    gradient: {
      from: string
      to: string
    }
    textColor: string
  }
}

export const mockKPIData: KPIData = {
  totalMonthlyCost: 4523000, // R$ 45,230.00
  costTrend: 12,
  potentialSavings: 485000, // R$ 4,850.00
  savingsOpportunities: 23,
  activeEmployees: 127,
  pendingOffboardings: 3,
  trackedSubscriptions: 34,
  ssoConnectedSubscriptions: 28,
}

export const mockChartData: ChartDataPoint[] = [
  { date: '01/12', productivity: 12500, design: 8200, development: 15300, salesMarketing: 6800, infrastructure: 2400 },
  { date: '05/12', productivity: 13100, design: 8200, development: 15800, salesMarketing: 7200, infrastructure: 2400 },
  { date: '10/12', productivity: 13800, design: 9100, development: 16200, salesMarketing: 7500, infrastructure: 2600 },
  { date: '15/12', productivity: 14200, design: 9100, development: 16500, salesMarketing: 7800, infrastructure: 2600 },
  { date: '20/12', productivity: 14800, design: 9800, development: 17100, salesMarketing: 8100, infrastructure: 2800 },
  { date: '25/12', productivity: 15200, design: 9800, development: 17400, salesMarketing: 8300, infrastructure: 2800 },
  { date: '30/12', productivity: 15600, design: 10200, development: 17800, salesMarketing: 8600, infrastructure: 3000 },
]

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'offboarding',
    severity: 'high',
    title: 'João Silva left the company',
    subtitle: 'Still has 5 active licenses (Slack, Figma, GitHub, Notion, Zoom)',
    actionLabel: 'Review licenses',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    type: 'renewal',
    severity: 'medium',
    title: 'Slack renews in 7 days',
    subtitle: 'Monthly cost: R$ 1,280 · 32 seats · Time to review usage',
    actionLabel: 'Review renewal',
    timestamp: '5 hours ago',
  },
  {
    id: '3',
    type: 'unused',
    severity: 'medium',
    title: '8 unused Figma licenses',
    subtitle: 'No login in the last 30 days · Potential saving: R$ 640/month',
    actionLabel: 'Review usage',
    timestamp: '1 day ago',
  },
  {
    id: '4',
    type: 'adoption',
    severity: 'low',
    title: 'Low Miro adoption',
    subtitle: 'Only 12 of 25 seats used (48%) · Consider reducing seats',
    actionLabel: 'View details',
    timestamp: '2 days ago',
  },
  {
    id: '5',
    type: 'duplicate',
    severity: 'low',
    title: 'Duplicate video tools detected',
    subtitle: 'You have Zoom and Google Meet · Consider consolidating',
    actionLabel: 'Compare tools',
    timestamp: '3 days ago',
  },
]

export const mockSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Slack',
    category: 'productivity',
    monthlyCostCents: 128000,
    totalSeats: 32,
    usedSeats: 28,
    adoptionRate: 87.5,
    renewalDate: '07/01/2025',
    daysUntilRenewal: 7,
    status: 'warning',
    icon: {
      text: 'S',
      gradient: { from: '#611f69', to: '#4a154b' },
      textColor: '#fff',
    },
  },
  {
    id: '2',
    name: 'Figma',
    category: 'design',
    monthlyCostCents: 120000,
    totalSeats: 15,
    usedSeats: 7,
    adoptionRate: 46.7,
    renewalDate: '12/01/2025',
    daysUntilRenewal: 12,
    status: 'critical',
    icon: {
      text: 'F',
      gradient: { from: '#f24e1e', to: '#a259ff' },
      textColor: '#fff',
    },
  },
  {
    id: '3',
    name: 'GitHub',
    category: 'development',
    monthlyCostCents: 210000,
    totalSeats: 42,
    usedSeats: 41,
    adoptionRate: 97.6,
    renewalDate: '28/02/2025',
    daysUntilRenewal: 59,
    status: 'active',
    icon: {
      text: 'G',
      gradient: { from: '#24292e', to: '#0d1117' },
      textColor: '#fff',
    },
  },
  {
    id: '4',
    name: 'Notion',
    category: 'productivity',
    monthlyCostCents: 80000,
    totalSeats: 20,
    usedSeats: 18,
    adoptionRate: 90.0,
    renewalDate: '15/01/2025',
    daysUntilRenewal: 15,
    status: 'active',
    icon: {
      text: 'N',
      gradient: { from: '#000', to: '#333' },
      textColor: '#fff',
    },
  },
  {
    id: '5',
    name: 'Zoom',
    category: 'video',
    monthlyCostCents: 149900,
    totalSeats: 30,
    usedSeats: 22,
    adoptionRate: 73.3,
    renewalDate: '20/01/2025',
    daysUntilRenewal: 20,
    status: 'active',
    icon: {
      text: 'Z',
      gradient: { from: '#2d8cff', to: '#0b5cff' },
      textColor: '#fff',
    },
  },
  {
    id: '6',
    name: 'Miro',
    category: 'design',
    monthlyCostCents: 100000,
    totalSeats: 25,
    usedSeats: 12,
    adoptionRate: 48.0,
    renewalDate: '10/02/2025',
    daysUntilRenewal: 41,
    status: 'warning',
    icon: {
      text: 'M',
      gradient: { from: '#ffd02f', to: '#f2c94c' },
      textColor: '#000',
    },
  },
  {
    id: '7',
    name: 'Linear',
    category: 'development',
    monthlyCostCents: 80000,
    totalSeats: 20,
    usedSeats: 19,
    adoptionRate: 95.0,
    renewalDate: '25/02/2025',
    daysUntilRenewal: 56,
    status: 'active',
    icon: {
      text: 'L',
      gradient: { from: '#5e6ad2', to: '#4353ff' },
      textColor: '#fff',
    },
  },
]

export const formatCurrency = (cents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Employee data types and mocks

export interface EmployeeKPIData {
  totalEmployees: number
  trend: number
  pendingOffboardings: number
  averageCostPerEmployee: number // in cents
  costTrend: number
  licenseUtilization: number
}

export interface OffboardingAlert {
  id: string
  name: string
  email: string
  offboardingDate: string
  timeAgo: string
  licenses: Array<{
    name: string
    icon: string
    color: string
  }>
  totalCost: number // in cents
}

export interface DepartmentBreakdown {
  name: string
  employeeCount: number
  monthlyCost: number // in cents
  percentage: number
  color: string
}

export interface Employee {
  id: string
  name: string
  email: string
  department: 'engineering' | 'product' | 'marketing' | 'sales' | 'design' | 'admin'
  status: 'active' | 'offboarding' | 'inactive'
  licenseCount: number
  licenses: Array<{
    name: string
    icon: string
    color: string
  }>
  monthlyCost: number // in cents
  lastActivity: string
  lastActivityTime: string
  activitySource: string
  avatar: {
    initials: string
    color: string
  }
  hasWarning?: boolean
}

export const mockEmployeeKPIs: EmployeeKPIData = {
  totalEmployees: 127,
  trend: 5,
  pendingOffboardings: 3,
  averageCostPerEmployee: 35600, // R$ 356
  costTrend: -8,
  licenseUtilization: 73,
}

export const mockOffboardingAlerts: OffboardingAlert[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@company.com',
    offboardingDate: '28/12/2024',
    timeAgo: '3 dias',
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    totalCost: 32000, // R$ 320
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria.santos@company.com',
    offboardingDate: '20/12/2024',
    timeAgo: '11 dias',
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
      { name: 'Notion', icon: 'N', color: '#000' },
    ],
    totalCost: 18000, // R$ 180
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro.costa@company.com',
    offboardingDate: '15/12/2024',
    timeAgo: '16 dias',
    licenses: [
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Linear', icon: 'L', color: '#5e6ad2' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Slack', icon: 'S', color: '#611f69' },
    ],
    totalCost: 28000, // R$ 280
  },
]

export const mockDepartmentBreakdown: DepartmentBreakdown[] = [
  {
    name: 'Engineering',
    employeeCount: 42,
    monthlyCost: 1890000, // R$ 18,900
    percentage: 33.1,
    color: '#3b82f6',
  },
  {
    name: 'Product',
    employeeCount: 18,
    monthlyCost: 810000, // R$ 8,100
    percentage: 14.2,
    color: '#8b5cf6',
  },
  {
    name: 'Marketing',
    employeeCount: 22,
    monthlyCost: 990000, // R$ 9,900
    percentage: 17.3,
    color: '#ec4899',
  },
  {
    name: 'Sales',
    employeeCount: 28,
    monthlyCost: 1260000, // R$ 12,600
    percentage: 22.0,
    color: '#f97316',
  },
  {
    name: 'Design',
    employeeCount: 12,
    monthlyCost: 540000, // R$ 5,400
    percentage: 9.4,
    color: '#14b8a6',
  },
  {
    name: 'Admin',
    employeeCount: 5,
    monthlyCost: 225000, // R$ 2,250
    percentage: 3.9,
    color: '#6b7280',
  },
]

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@company.com',
    department: 'engineering',
    status: 'active',
    licenseCount: 6,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Linear', icon: 'L', color: '#5e6ad2' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 42000,
    lastActivity: '2 horas',
    lastActivityTime: '2 horas',
    activitySource: 'via GitHub',
    avatar: { initials: 'AS', color: '#3b82f6' },
  },
  {
    id: '2',
    name: 'Bruno Costa',
    email: 'bruno.costa@company.com',
    department: 'product',
    status: 'active',
    licenseCount: 5,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Miro', icon: 'M', color: '#ffd02f' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 38000,
    lastActivity: '5 horas',
    lastActivityTime: '5 horas',
    activitySource: 'via Figma',
    avatar: { initials: 'BC', color: '#8b5cf6' },
  },
  {
    id: '3',
    name: 'Carla Mendes',
    email: 'carla.mendes@company.com',
    department: 'marketing',
    status: 'active',
    licenseCount: 4,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
      { name: 'Miro', icon: 'M', color: '#ffd02f' },
    ],
    monthlyCost: 32000,
    lastActivity: '1 dia',
    lastActivityTime: '1 dia',
    activitySource: 'via Slack',
    avatar: { initials: 'CM', color: '#ec4899' },
  },
  {
    id: '4',
    name: 'Daniel Oliveira',
    email: 'daniel.oliveira@company.com',
    department: 'sales',
    status: 'active',
    licenseCount: 3,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
      { name: 'Notion', icon: 'N', color: '#000' },
    ],
    monthlyCost: 28000,
    lastActivity: '3 horas',
    lastActivityTime: '3 horas',
    activitySource: 'via Zoom',
    avatar: { initials: 'DO', color: '#f97316' },
  },
  {
    id: '5',
    name: 'Eduarda Santos',
    email: 'eduarda.santos@company.com',
    department: 'design',
    status: 'active',
    licenseCount: 5,
    licenses: [
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Miro', icon: 'M', color: '#ffd02f' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 40000,
    lastActivity: '1 hora',
    lastActivityTime: '1 hora',
    activitySource: 'via Figma',
    avatar: { initials: 'ES', color: '#14b8a6' },
  },
  {
    id: '6',
    name: 'Felipe Rocha',
    email: 'felipe.rocha@company.com',
    department: 'engineering',
    status: 'active',
    licenseCount: 4,
    licenses: [
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Linear', icon: 'L', color: '#5e6ad2' },
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Notion', icon: 'N', color: '#000' },
    ],
    monthlyCost: 35000,
    lastActivity: '4 horas',
    lastActivityTime: '4 horas',
    activitySource: 'via Linear',
    avatar: { initials: 'FR', color: '#3b82f6' },
  },
  {
    id: '7',
    name: 'Gabriela Lima',
    email: 'gabriela.lima@company.com',
    department: 'product',
    status: 'active',
    licenseCount: 5,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Linear', icon: 'L', color: '#5e6ad2' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 38000,
    lastActivity: '6 horas',
    lastActivityTime: '6 horas',
    activitySource: 'via Linear',
    avatar: { initials: 'GL', color: '#8b5cf6' },
  },
  {
    id: '8',
    name: 'Hugo Ferreira',
    email: 'hugo.ferreira@company.com',
    department: 'engineering',
    status: 'active',
    licenseCount: 3,
    licenses: [
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 30000,
    lastActivity: '32 dias',
    lastActivityTime: '32 dias',
    activitySource: 'via Okta',
    avatar: { initials: 'HF', color: '#3b82f6' },
    hasWarning: true,
  },
  {
    id: '9',
    name: 'Isabel Martins',
    email: 'isabel.martins@company.com',
    department: 'admin',
    status: 'active',
    licenseCount: 3,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 28000,
    lastActivity: '2 dias',
    lastActivityTime: '2 dias',
    activitySource: 'via Slack',
    avatar: { initials: 'IM', color: '#6b7280' },
  },
  {
    id: '10',
    name: 'João Silva',
    email: 'joao.silva@company.com',
    department: 'engineering',
    status: 'offboarding',
    licenseCount: 5,
    licenses: [
      { name: 'Slack', icon: 'S', color: '#611f69' },
      { name: 'GitHub', icon: 'G', color: '#24292e' },
      { name: 'Figma', icon: 'F', color: '#f24e1e' },
      { name: 'Notion', icon: 'N', color: '#000' },
      { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
    ],
    monthlyCost: 32000,
    lastActivity: '3 dias',
    lastActivityTime: '3 dias',
    activitySource: 'via Okta',
    avatar: { initials: 'JS', color: '#3b82f6' },
  },
]
