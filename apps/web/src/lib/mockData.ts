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
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'resolved' | 'dismissed'
  title: string
  message: string
  detail: string
  timeAgo: string
  data?: {
    // For offboarding alerts
    employeeName?: string
    offboardingDate?: string
    licenses?: Array<{ name: string; icon: string; color: string }>
    monthlyCost?: number

    // For renewal alerts
    subscriptionName?: string
    renewalDate?: string
    daysUntilRenewal?: number
    annualCost?: number
    seats?: { total: number; used: number }
    adoptionRate?: number
    suggestion?: string

    // For unused license alerts
    unusedCount?: number
    unusedUsers?: Array<{ name: string; daysInactive: number }>
    potentialSavings?: number

    // For duplicate tool alerts
    tools?: Array<{
      name: string
      cost: string
      users: number
      adoption: number
    }>

    // For resolved alerts
    resolvedDate?: string
    resolvedAction?: string
    savedAmount?: number
  }
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

export interface AlertKPIData {
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  totalPotentialSavings: number // in cents
}

export const mockAlertKPIs: AlertKPIData = {
  criticalCount: 3,
  highCount: 5,
  mediumCount: 12,
  lowCount: 3,
  totalPotentialSavings: 485000, // R$ 4,850
}

export const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'offboarding',
    priority: 'critical',
    status: 'pending',
    title: 'Offboarding Pendente',
    message: 'João Silva tem 5 licenças ativas',
    detail: 'Saiu da empresa em 26/12/2024',
    timeAgo: 'Há 3 dias',
    data: {
      employeeName: 'João Silva',
      offboardingDate: '26/12/2024',
      licenses: [
        { name: 'Slack', icon: 'S', color: '#611f69' },
        { name: 'Figma', icon: 'F', color: '#f24e1e' },
        { name: 'GitHub', icon: 'G', color: '#24292e' },
        { name: 'Notion', icon: 'N', color: '#000' },
        { name: 'Zoom', icon: 'Z', color: '#2d8cff' },
      ],
      monthlyCost: 28700,
    },
  },
  {
    id: '2',
    type: 'renewal',
    priority: 'high',
    status: 'pending',
    title: 'Renovação Próxima',
    message: 'Slack renova em 7 dias (15/01/2025)',
    detail: 'Ciclo anual • Última renovação: Jan 2024',
    timeAgo: 'Há 1 dia',
    data: {
      subscriptionName: 'Slack',
      renewalDate: '15/01/2025',
      daysUntilRenewal: 7,
      monthlyCost: 234000,
      annualCost: 2808000,
      seats: { total: 50, used: 42 },
      adoptionRate: 84,
      suggestion: 'Considere reduzir para 45 seats (-R$ 468/ano)',
    },
  },
  {
    id: '3',
    type: 'unused',
    priority: 'medium',
    status: 'pending',
    title: 'Licenças Não Utilizadas',
    message: '8 licenças do Figma sem uso há mais de 30 dias',
    detail: '',
    timeAgo: 'Há 5 dias',
    data: {
      subscriptionName: 'Figma',
      unusedCount: 8,
      potentialSavings: 75600,
      unusedUsers: [
        { name: 'Bruno Ferreira', daysInactive: 45 },
        { name: 'Juliana Alves', daysInactive: 38 },
        { name: 'Carlos Lima', daysInactive: 35 },
      ],
    },
  },
  {
    id: '4',
    type: 'duplicate',
    priority: 'low',
    status: 'pending',
    title: 'Possível Duplicidade',
    message: 'Você tem 2 ferramentas na categoria "Videoconferência"',
    detail: '',
    timeAgo: 'Há 2 semanas',
    data: {
      tools: [
        { name: 'Zoom', cost: 'R$ 890/mês', users: 25, adoption: 67 },
        { name: 'Google Meet', cost: 'Incluso no GWS', users: 127, adoption: 89 },
      ],
      potentialSavings: 89000,
    },
  },
  {
    id: '5',
    type: 'offboarding',
    priority: 'critical',
    status: 'resolved',
    title: 'Offboarding',
    message: 'Ana Oliveira — 4 licenças revogadas',
    detail: '',
    timeAgo: '26/12/2024',
    data: {
      employeeName: 'Ana Oliveira',
      resolvedDate: '26/12/2024',
      resolvedAction: '4 licenças revogadas',
      savedAmount: 28700,
    },
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

// Subscription page data types and mocks

export interface SubscriptionKPIData {
  totalMonthlyCost: number // in cents
  costTrend: number
  potentialSavings: number // in cents
  savingsOpportunities: number
  upcomingRenewals: number
  upcomingRenewalsCost: number // in cents
  averageAdoptionRate: number
}

export interface CategorySpending {
  category: string
  amount: number // in cents
  color: string
}

export interface RenewalItem {
  id: string
  name: string
  monthlyCostCents: number
  renewalDate: string
  daysUntilRenewal: number
  icon: string
  color: string
}

export const mockSubscriptionKPIs: SubscriptionKPIData = {
  totalMonthlyCost: 4523000, // R$ 45,230
  costTrend: 12,
  potentialSavings: 485000, // R$ 4,850
  savingsOpportunities: 23,
  upcomingRenewals: 5,
  upcomingRenewalsCost: 842000, // R$ 8,420
  averageAdoptionRate: 73,
}

export const mockCategorySpending: CategorySpending[] = [
  { category: 'productivity', amount: 1234000, color: '#10b981' },
  { category: 'infrastructure', amount: 1089000, color: '#ec4899' },
  { category: 'sales', amount: 810000, color: '#f97316' },
  { category: 'development', amount: 640000, color: '#3b82f6' },
  { category: 'design', amount: 420000, color: '#8b5cf6' },
  { category: 'communication', amount: 210000, color: '#06b6d4' },
  { category: 'other', amount: 120000, color: '#6b7280' },
]

export const mockRenewals: RenewalItem[] = [
  {
    id: '1',
    name: 'Slack',
    monthlyCostCents: 234000,
    renewalDate: '04/01/2025',
    daysUntilRenewal: 4,
    icon: 'S',
    color: '#611f69',
  },
  {
    id: '2',
    name: 'Zoom',
    monthlyCostCents: 89000,
    renewalDate: '07/01/2025',
    daysUntilRenewal: 7,
    icon: 'Z',
    color: '#2d8cff',
  },
  {
    id: '3',
    name: 'Figma',
    monthlyCostCents: 189000,
    renewalDate: '15/01/2025',
    daysUntilRenewal: 15,
    icon: 'F',
    color: '#f24e1e',
  },
  {
    id: '4',
    name: 'Notion',
    monthlyCostCents: 98000,
    renewalDate: '28/01/2025',
    daysUntilRenewal: 28,
    icon: 'N',
    color: '#000',
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

// ============================================
// Reports Data
// ============================================

export interface ReportKPIData {
  totalSpend: number // in cents
  spendTrend: number // percentage
  savedThisMonth: number // in cents
  averageAdoption: number // percentage
  adoptionTrend: number // percentage
  activeTools: number
}

export interface TopSpender {
  id: string
  name: string
  icon: { text: string; color: string }
  amount: number // in cents
}

export interface CategorySpend {
  category: 'productivity' | 'infrastructure' | 'sales' | 'development' | 'design' | 'communication'
  amount: number // in cents
  percentage: number
}

export interface DepartmentSpend {
  department: string
  amount: number // in cents
  percentage: number
  color: string
}

export interface PeriodAction {
  type: 'resolved' | 'saved' | 'pending' | 'renewals'
  label: string
  value: string | number
}

export interface Highlight {
  icon: string
  label: string
  text: string
}

export interface MonthlySpending {
  month: string
  amount: number // in cents
}

export interface AdoptionData {
  name: string
  rate: number // percentage
  status: 'high' | 'medium' | 'low'
}

export interface TopUser {
  id: string
  name: string
  appsCount: number
}

export interface UnderusedLicense {
  name: string
  icon: { text: string; color: string }
  idleCount: number
  severity: 'critical' | 'warning'
}

export interface SavingByType {
  type: string
  amount: number // in cents
  percentage: number
  color: string
}

export interface SavingAction {
  date: string
  action: string
  amount: number // in cents (monthly)
}

export interface YearComparison {
  year: string
  total: number // in cents
  monthlyAvg: number // in cents
  savings: number // in cents
  toolsCount: number
  employeesCount: number
  costPerEmployee: number // in cents
}

export const mockReportKPIData: ReportKPIData = {
  totalSpend: 4523000, // R$ 45,230
  spendTrend: 12,
  savedThisMonth: 485000, // R$ 4,850
  averageAdoption: 73,
  adoptionTrend: 5,
  activeTools: 34,
}

export const mockTopSpenders: TopSpender[] = [
  { id: '1', name: 'AWS', icon: { text: 'A', color: '#ff9900' }, amount: 845000 },
  { id: '2', name: 'HubSpot', icon: { text: 'H', color: '#ff7a59' }, amount: 450000 },
  { id: '3', name: 'Google Workspace', icon: { text: 'G', color: '#4285f4' }, amount: 381000 },
  { id: '4', name: 'GitHub', icon: { text: 'G', color: '#24292f' }, amount: 320000 },
  { id: '5', name: 'Slack', icon: { text: 'S', color: '#611f69' }, amount: 234000 },
]

export const mockCategorySpends: CategorySpend[] = [
  { category: 'productivity', amount: 1234000, percentage: 27 },
  { category: 'infrastructure', amount: 1089000, percentage: 24 },
  { category: 'sales', amount: 810000, percentage: 18 },
  { category: 'development', amount: 640000, percentage: 14 },
  { category: 'design', amount: 420000, percentage: 9 },
  { category: 'communication', amount: 330000, percentage: 8 },
]

export const mockDepartmentSpends: DepartmentSpend[] = [
  { department: 'engineering', amount: 1842000, percentage: 41, color: '#3b82f6' },
  { department: 'product', amount: 980000, percentage: 22, color: '#8b5cf6' },
  { department: 'marketing', amount: 520000, percentage: 12, color: '#ec4899' },
  { department: 'sales', amount: 480000, percentage: 11, color: '#f97316' },
  { department: 'other', amount: 701000, percentage: 14, color: '#6b7280' },
]

export const mockPeriodActions: PeriodAction[] = [
  { type: 'resolved', label: 'alertsResolved', value: 12 },
  { type: 'saved', label: 'saved', value: 485000 }, // in cents
  { type: 'pending', label: 'pendingAlerts', value: 3 },
  { type: 'renewals', label: 'upcomingRenewals', value: 5 },
]

export const mockHighlights: Highlight[] = [
  { icon: '📈', label: 'biggestIncrease', text: 'Infrastructure (+18%)' },
  { icon: '📉', label: 'biggestReduction', text: 'Design (-12% after consolidation)' },
  { icon: '🏆', label: 'bestAdoption', text: 'GitHub (93%)' },
  { icon: '⚠️', label: 'worstAdoption', text: 'Notion (32%)' },
]

export const mockMonthlySpending: MonthlySpending[] = [
  { month: 'Jul', amount: 3950000 },
  { month: 'Aug', amount: 4120000 },
  { month: 'Sep', amount: 4080000 },
  { month: 'Oct', amount: 4230000 },
  { month: 'Nov', amount: 4340000 },
  { month: 'Dec', amount: 4523000 },
]

export const mockAdoptionData: AdoptionData[] = [
  { name: 'Google WS', rate: 95, status: 'high' },
  { name: 'GitHub', rate: 93, status: 'high' },
  { name: 'Slack', rate: 84, status: 'high' },
  { name: 'HubSpot', rate: 80, status: 'high' },
  { name: 'Zoom', rate: 67, status: 'medium' },
  { name: 'Figma', rate: 53, status: 'medium' },
  { name: 'Notion', rate: 32, status: 'low' },
]

export const mockTopUsers: TopUser[] = [
  { id: '1', name: 'Ricardo M.', appsCount: 12 },
  { id: '2', name: 'Maria S.', appsCount: 10 },
  { id: '3', name: 'Pedro C.', appsCount: 9 },
  { id: '4', name: 'Ana O.', appsCount: 8 },
  { id: '5', name: 'Carlos L.', appsCount: 7 },
]

export const mockUnderusedLicenses: UnderusedLicense[] = [
  { name: 'Notion', icon: { text: 'N', color: '#000' }, idleCount: 26, severity: 'critical' },
  { name: 'Figma', icon: { text: 'F', color: '#f24e1e' }, idleCount: 9, severity: 'warning' },
  { name: 'Zoom', icon: { text: 'Z', color: '#2d8cff' }, idleCount: 5, severity: 'warning' },
]

export const mockSavingsByType: SavingByType[] = [
  { type: 'offboarding', amount: 1842000, percentage: 43, color: '#10b981' },
  { type: 'seatReduction', amount: 1234000, percentage: 29, color: '#0d9488' },
  { type: 'negotiation', amount: 820000, percentage: 19, color: '#3b82f6' },
  { type: 'consolidation', amount: 372000, percentage: 9, color: '#d97706' },
]

export const mockSavingActions: SavingAction[] = [
  { date: '26/12', action: 'Offboarding João Silva', amount: 28700 },
  { date: '20/12', action: 'Reduced Figma 20→15 seats', amount: 63000 },
  { date: '15/12', action: 'Renegotiated Slack -10%', amount: 23400 },
  { date: '01/12', action: 'Cancelled Zoom (migrated to Meet)', amount: 89000 },
]

export const mockYearComparison: YearComparison[] = [
  {
    year: '2024',
    total: 49876000, // R$ 498,760
    monthlyAvg: 4156300, // R$ 41,563
    savings: 4268000, // R$ 42,680
    toolsCount: 34,
    employeesCount: 127,
    costPerEmployee: 32700, // R$ 327
  },
  {
    year: '2023',
    total: 41234000, // R$ 412,340
    monthlyAvg: 3436200, // R$ 34,362
    savings: 2842000, // R$ 28,420
    toolsCount: 28,
    employeesCount: 98,
    costPerEmployee: 35100, // R$ 351
  },
]

export const mockTotalSavings2024 = 4268000 // R$ 42,680
export const mockSavingsGoal = 5000000 // R$ 50,000
export const mockSavingsProgress = 85 // percentage
export const mockPendingOpportunities = {
  count: 23,
  monthlyAmount: 485000, // R$ 4,850/month
  yearlyAmount: 5820000, // R$ 58,200/year
}
