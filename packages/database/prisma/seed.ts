/**
 * SaaStral Database Seed Script
 *
 * This script populates the database with comprehensive test data including:
 * - Organizations with different plans
 * - Users and organization members
 * - Departments with hierarchies
 * - Employees (active and offboarded)
 * - Subscriptions across all categories
 * - Subscription assignments with usage patterns
 * - Login events for usage tracking
 * - Alerts of various types
 * - Integration configurations
 * - Historical cost data
 * - SaaS catalog entries
 */

import { PrismaClient } from '../generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createAuth } from '@saastral/shared'

// Initialize Prisma with adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Initialize BetterAuth for user creation
const auth = createAuth(pool)

// Default password for seeded users
const DEFAULT_PASSWORD = '12345678'

// Helper function to get random item from array
function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper function to get random date in the past
function randomPastDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date
}

// Helper function to get future date
function futureDate(daysAhead: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date
}

// Convert BRL to cents
function toCents(brl: number): bigint {
  return BigInt(Math.round(brl * 100))
}

// Random number between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate realistic Brazilian names
const firstNames = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Paula', 'Lucas', 'Juliana',
  'Fernando', 'Camila', 'Roberto', 'Fernanda', 'Ricardo', 'Mariana', 'Bruno',
  'Beatriz', 'Rafael', 'Carolina', 'Felipe', 'Larissa', 'André', 'Gabriela',
  'Thiago', 'Amanda', 'Rodrigo', 'Patrícia', 'Marcelo', 'Aline', 'Eduardo',
  'Renata', 'Diego', 'Vanessa', 'Gustavo', 'Cristina', 'Henrique', 'Silvia',
  'Vitor', 'Daniela', 'Leandro', 'Tatiana', 'Márcio', 'Bianca', 'Alexandre',
  'Priscila', 'Fábio', 'Carla', 'Luiz', 'Adriana', 'Mateus', 'Lívia'
]

const lastNames = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Rocha', 'Almeida', 'Nascimento', 'Araújo', 'Vieira', 'Monteiro', 'Mendes',
  'Barros', 'Freitas', 'Barbosa', 'Pinto', 'Moreira', 'Cavalcanti', 'Dias',
  'Castro', 'Campos', 'Cardoso', 'Correia', 'Teixeira', 'Farias', 'Machado'
]

const jobTitles = {
  engineering: [
    'Software Engineer', 'Senior Software Engineer', 'Staff Engineer', 'Principal Engineer',
    'Frontend Developer', 'Backend Developer', 'Full-Stack Developer', 'DevOps Engineer',
    'Engineering Manager', 'Tech Lead', 'VP of Engineering', 'CTO', 'QA Engineer'
  ],
  design: [
    'Product Designer', 'Senior Designer', 'UX Designer', 'UI Designer', 'UX Researcher',
    'Design Lead', 'Head of Design', 'Graphic Designer', 'Brand Designer'
  ],
  sales: [
    'Sales Representative', 'Account Executive', 'Sales Manager', 'Sales Director',
    'Business Development Rep', 'VP of Sales', 'Chief Revenue Officer'
  ],
  marketing: [
    'Marketing Analyst', 'Marketing Manager', 'Content Writer', 'SEO Specialist',
    'Social Media Manager', 'Growth Manager', 'CMO', 'Marketing Coordinator'
  ],
  hr: [
    'HR Manager', 'HR Coordinator', 'Recruiter', 'People Operations Manager',
    'Talent Acquisition Specialist', 'CHRO', 'HR Business Partner'
  ],
  finance: [
    'Financial Analyst', 'Accountant', 'Finance Manager', 'Controller', 'CFO',
    'Accounts Payable', 'Accounts Receivable', 'Treasury Analyst'
  ],
  operations: [
    'Operations Manager', 'Operations Coordinator', 'COO', 'Office Manager',
    'Administrative Assistant', 'Project Manager', 'Program Manager'
  ],
  support: [
    'Customer Support Rep', 'Customer Success Manager', 'Support Manager',
    'Technical Support Engineer', 'Head of Support'
  ]
}

function generateRandomName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = randomItem(firstNames)
  const lastName = randomItem(lastNames)
  return {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`
  }
}

function generateEmail(name: { firstName: string; lastName: string }, domain: string, uniqueId?: number): string {
  const first = name.firstName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const last = name.lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (uniqueId !== undefined) {
    return `${first}.${last}.${uniqueId}@${domain}`
  }

  return `${first}.${last}@${domain}`
}

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clear existing data (in correct order to respect foreign keys)
  console.log('🧹 Cleaning existing data...')
  await prisma.notification.deleteMany()
  await prisma.syncLog.deleteMany()
  await prisma.loginEvent.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.document.deleteMany()
  await prisma.subscriptionUser.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.department.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.organizationMember.deleteMany()
  await prisma.costHistory.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.betterAuthSession.deleteMany()
  await prisma.betterAuthAccount.deleteMany()
  await prisma.betterAuthVerification.deleteMany()
  await prisma.user.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.saasCatalog.deleteMany()
  console.log('✓ Database cleaned\n')

  // ============================================================================
  // SAAS CATALOG (Pre-populated known tools)
  // ============================================================================
  console.log('📚 Seeding SaaS catalog...')

  const catalogTools = [
    { name: 'Slack', vendor: 'Slack Technologies', category: 'communication', website: 'https://slack.com', oktaAppName: 'Slack' },
    { name: 'GitHub', vendor: 'GitHub Inc.', category: 'development', website: 'https://github.com', oktaAppName: 'GitHub' },
    { name: 'Figma', vendor: 'Figma Inc.', category: 'design', website: 'https://figma.com', oktaAppName: 'Figma' },
    { name: 'Notion', vendor: 'Notion Labs', category: 'productivity', website: 'https://notion.so', oktaAppName: 'Notion' },
    { name: 'Linear', vendor: 'Linear', category: 'productivity', website: 'https://linear.app', oktaAppName: 'Linear' },
    { name: 'Zoom', vendor: 'Zoom Video Communications', category: 'communication', website: 'https://zoom.us', oktaAppName: 'Zoom' },
    { name: 'Google Meet', vendor: 'Google', category: 'communication', website: 'https://meet.google.com', googleAppName: 'Google Meet' },
    { name: 'Jira', vendor: 'Atlassian', category: 'productivity', website: 'https://atlassian.com/jira', oktaAppName: 'Jira' },
    { name: 'Confluence', vendor: 'Atlassian', category: 'productivity', website: 'https://atlassian.com/confluence', oktaAppName: 'Confluence' },
    { name: 'AWS', vendor: 'Amazon Web Services', category: 'infrastructure', website: 'https://aws.amazon.com', oktaAppName: 'AWS' },
    { name: 'Vercel', vendor: 'Vercel Inc.', category: 'infrastructure', website: 'https://vercel.com', oktaAppName: 'Vercel' },
    { name: 'MongoDB Atlas', vendor: 'MongoDB', category: 'infrastructure', website: 'https://mongodb.com/atlas', oktaAppName: 'MongoDB Atlas' },
    { name: 'Salesforce', vendor: 'Salesforce', category: 'sales_marketing', website: 'https://salesforce.com', oktaAppName: 'Salesforce' },
    { name: 'HubSpot', vendor: 'HubSpot', category: 'sales_marketing', website: 'https://hubspot.com', oktaAppName: 'HubSpot' },
    { name: 'Intercom', vendor: 'Intercom', category: 'support', website: 'https://intercom.com', oktaAppName: 'Intercom' },
    { name: 'Zendesk', vendor: 'Zendesk', category: 'support', website: 'https://zendesk.com', oktaAppName: 'Zendesk' },
    { name: 'BambooHR', vendor: 'BambooHR', category: 'hr', website: 'https://bamboohr.com', oktaAppName: 'BambooHR' },
    { name: 'Gusto', vendor: 'Gusto', category: 'hr', website: 'https://gusto.com', oktaAppName: 'Gusto' },
    { name: 'Datadog', vendor: 'Datadog', category: 'analytics', website: 'https://datadoghq.com', oktaAppName: 'Datadog' },
    { name: 'Sentry', vendor: 'Sentry', category: 'analytics', website: 'https://sentry.io', oktaAppName: 'Sentry' },
    { name: '1Password', vendor: '1Password', category: 'security', website: 'https://1password.com', oktaAppName: '1Password' },
    { name: 'Okta', vendor: 'Okta Inc.', category: 'security', website: 'https://okta.com', oktaAppName: 'Okta' },
  ]

  for (const tool of catalogTools) {
    await prisma.saasCatalog.create({
      data: {
        name: tool.name,
        vendor: tool.vendor,
        category: tool.category as any,
        website: tool.website,
        oktaAppName: tool.oktaAppName,
        googleAppName: tool.googleAppName,
        aliases: [tool.name.toLowerCase(), tool.vendor?.toLowerCase() || ''].filter(Boolean),
      },
    })
  }

  console.log(`✓ Created ${catalogTools.length} SaaS catalog entries\n`)

  // ============================================================================
  // ORGANIZATIONS
  // ============================================================================
  console.log('🏢 Seeding organizations...')

  const organizationsData = [
    {
      name: 'Acme Corporation',
      slug: 'acme',
      domain: 'acme.com',
      plan: 'business' as const,
      planStartedAt: randomPastDate(90),
      employeeCount: 50,
    },
    {
      name: 'TechBrasil Ltda',
      slug: 'techbrasil',
      domain: 'techbrasil.com.br',
      plan: 'business' as const,
      planStartedAt: randomPastDate(120),
      employeeCount: 35,
    },
    {
      name: 'StartupHub Inovação',
      slug: 'startuphub',
      domain: 'startuphub.io',
      plan: 'team' as const,
      planStartedAt: randomPastDate(30),
      employeeCount: 25,
    },
    {
      name: 'FinTech Solutions',
      slug: 'fintechsolutions',
      domain: 'fintechsolutions.com.br',
      plan: 'business' as const,
      planStartedAt: randomPastDate(180),
      employeeCount: 45,
    },
    {
      name: 'CloudSys Sistemas',
      slug: 'cloudsys',
      domain: 'cloudsys.com.br',
      plan: 'enterprise' as const,
      planStartedAt: randomPastDate(365),
      employeeCount: 80,
    },
    {
      name: 'Digital Ventures',
      slug: 'digitalventures',
      domain: 'digitalventures.io',
      plan: 'team' as const,
      planStartedAt: randomPastDate(60),
      employeeCount: 20,
    },
    {
      name: 'MegaCorp Tecnologia',
      slug: 'megacorp',
      domain: 'megacorp.com.br',
      plan: 'enterprise' as const,
      planStartedAt: randomPastDate(730),
      employeeCount: 120,
    },
  ]

  const organizations: Array<{ id: string; name: string; domain: string | null; employeeCount: number }> = []
  for (const orgData of organizationsData) {
    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
        domain: orgData.domain,
        plan: orgData.plan,
        planStartedAt: orgData.planStartedAt,
        settings: {
          timezone: 'America/Sao_Paulo',
          currency: 'BRL',
          alertDefaults: {
            unusedLicenseDays: 30,
            lowUtilizationThreshold: 50,
            renewalReminderDays: [30, 15, 7],
          },
        },
      },
    })
    organizations.push({ id: org.id, name: org.name, domain: org.domain, employeeCount: orgData.employeeCount })
  }

  // Keep reference to first org for backward compatibility (used in seeding below)
  const acmeOrg = organizations[0]

  console.log(`✓ Created ${organizations.length} organizations\n`)

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('👤 Seeding users...')

  // Create 1-2 users per organization, plus a fixed test user
  const usersData: Array<{ email: string; name: string; orgIndex: number; role: 'owner' | 'admin' }> = []

  // Always create a fixed test user as owner of the first organization
  usersData.push({
    email: 'test@saastral.com',
    name: 'Test User',
    orgIndex: 0,
    role: 'owner'
  })

  organizations.forEach((org, index) => {
    const domain = org.domain || 'example.com'
    const name1 = generateRandomName()
    usersData.push({
      email: generateEmail(name1, domain),
      name: name1.fullName,
      orgIndex: index,
      role: index === 0 ? 'admin' : 'owner'
    })

    // Larger orgs get a second admin user
    if (org.employeeCount > 30) {
      const name2 = generateRandomName()
      usersData.push({
        email: generateEmail(name2, domain),
        name: name2.fullName,
        orgIndex: index,
        role: 'admin'
      })
    }
  })

  const users = []
  for (const userData of usersData) {
    // Use BetterAuth API to create user with properly hashed password
    const result = await auth.api.signUpEmail({
      body: {
        email: userData.email,
        password: DEFAULT_PASSWORD,
        name: userData.name,
      },
    })

    // Update the user with additional fields that BetterAuth doesn't handle
    const user = await prisma.user.update({
      where: { id: result.user.id },
      data: {
        emailVerifiedAt: randomPastDate(60),
        emailVerified: true,
        lastLoginAt: randomPastDate(1),
        preferences: {
          language: 'pt-BR',
          notifications: { email: true, inApp: true }
        },
      },
    })

    users.push({ ...user, orgIndex: userData.orgIndex, role: userData.role })
  }

  console.log(`✓ Created ${users.length} users with password: "${DEFAULT_PASSWORD}"\n`)

  // ============================================================================
  // ORGANIZATION MEMBERS
  // ============================================================================
  console.log('👥 Seeding organization members...')

  const memberPromises = []
  for (const user of users) {
    const org = organizations[user.orgIndex]
    const ownerUser = users.find(u => u.orgIndex === user.orgIndex && u.role === 'owner')

    memberPromises.push(
      prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: user.role,
          invitedBy: user.role === 'admin' ? ownerUser?.id : undefined,
          acceptedAt: randomPastDate(60),
        },
      })
    )
  }

  await Promise.all(memberPromises)

  console.log('✓ Created organization memberships\n')

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================
  console.log('🏛️ Seeding departments...')

  const departmentsByOrg: Record<string, any[]> = {}

  for (const org of organizations) {
    const orgDepts = []

    // All organizations get core departments
    const engineering = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: 'Engineering',
        description: 'Product development and infrastructure',
      },
    })
    orgDepts.push({ dept: engineering, category: 'engineering' })

    // Larger orgs get sub-departments
    if (org.employeeCount > 40) {
      const frontend = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Frontend',
          description: 'Frontend development team',
          parentId: engineering.id,
        },
      })
      orgDepts.push({ dept: frontend, category: 'engineering' })

      const backend = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Backend',
          description: 'Backend development team',
          parentId: engineering.id,
        },
      })
      orgDepts.push({ dept: backend, category: 'engineering' })
    }

    const design = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: 'Design',
        description: 'Product design and UX',
      },
    })
    orgDepts.push({ dept: design, category: 'design' })

    const sales = await prisma.department.create({
      data: {
        organizationId: org.id,
        name: 'Sales',
        description: 'Sales and business development',
      },
    })
    orgDepts.push({ dept: sales, category: 'sales' })

    // Medium and large orgs get more departments
    if (org.employeeCount > 30) {
      const marketing = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Marketing',
          description: 'Marketing and growth',
        },
      })
      orgDepts.push({ dept: marketing, category: 'marketing' })

      const hr = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'People & HR',
          description: 'Human resources and talent',
        },
      })
      orgDepts.push({ dept: hr, category: 'hr' })
    }

    // Large orgs get full suite
    if (org.employeeCount > 60) {
      const finance = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Finance',
          description: 'Finance and accounting',
        },
      })
      orgDepts.push({ dept: finance, category: 'finance' })

      const operations = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Operations',
          description: 'Operations and administration',
        },
      })
      orgDepts.push({ dept: operations, category: 'operations' })

      const support = await prisma.department.create({
        data: {
          organizationId: org.id,
          name: 'Customer Support',
          description: 'Customer success and support',
        },
      })
      orgDepts.push({ dept: support, category: 'support' })
    }

    departmentsByOrg[org.id] = orgDepts
  }

  // Keep backward compatibility references (for existing seed code below)
  const acmeEngineering = departmentsByOrg[acmeOrg.id].find(d => d.dept.name === 'Engineering')?.dept
  const acmeDesign = departmentsByOrg[acmeOrg.id].find(d => d.dept.name === 'Design')?.dept
  const acmeSales = departmentsByOrg[acmeOrg.id].find(d => d.dept.name === 'Sales')?.dept

  const totalDepts = Object.values(departmentsByOrg).reduce((sum, depts) => sum + depts.length, 0)
  console.log(`✓ Created ${totalDepts} departments across all organizations\n`)

  // ============================================================================
  // EMPLOYEES
  // ============================================================================
  console.log('👨‍💼 Seeding employees...')

  const allEmployees: any[] = []
  const allOffboarded: any[] = []
  let externalIdCounter = 100000
  let emailCounter = 1

  for (const org of organizations) {
    const domain = org.domain || 'example.com'
    const orgDepts = departmentsByOrg[org.id]
    const ownerUser = users.find(u => u.orgIndex === organizations.indexOf(org) && u.role === 'owner')

    // Calculate how many employees per department
    const activeCount = Math.floor(org.employeeCount * 0.95) // 95% active
    const offboardedCount = org.employeeCount - activeCount // 5% offboarded

    const employeesPerDept = Math.ceil(activeCount / orgDepts.length)

    // Create active employees distributed across departments
    for (const { dept, category } of orgDepts) {
      const deptTitles = jobTitles[category as keyof typeof jobTitles] || jobTitles.operations
      const employeesInDept = randomInt(
        Math.max(1, employeesPerDept - 3),
        employeesPerDept + 3
      )

      for (let i = 0; i < employeesInDept; i++) {
        const name = generateRandomName()
        const email = generateEmail(name, domain, emailCounter++)
        const title = randomItem(deptTitles)
        const hiredDaysAgo = randomInt(30, 1095) // Hired between 1 month and 3 years ago

        const employee = await prisma.employee.create({
          data: {
            organizationId: org.id,
            name: name.fullName,
            email,
            title,
            status: 'active',
            departmentId: dept.id,
            hiredAt: randomPastDate(hiredDaysAgo),
            externalId: `google-${externalIdCounter++}`,
            externalProvider: 'google',
            monthlySaasCost: toCents(randomInt(150, 500)),
            createdBy: ownerUser?.id,
          },
        })

        allEmployees.push({ ...employee, orgId: org.id })
      }
    }

    // Create offboarded employees (5% of total)
    for (let i = 0; i < offboardedCount; i++) {
      const name = generateRandomName()
      const email = generateEmail(name, domain, emailCounter++)
      const dept = randomItem(orgDepts)
      const deptTitles = jobTitles[dept.category as keyof typeof jobTitles] || jobTitles.operations
      const title = randomItem(deptTitles)

      const employee = await prisma.employee.create({
        data: {
          organizationId: org.id,
          name: name.fullName,
          email,
          title: `Former ${title}`,
          status: 'offboarded',
          departmentId: dept.dept.id,
          hiredAt: randomPastDate(randomInt(180, 1095)),
          offboardedAt: randomPastDate(randomInt(1, 30)),
          externalId: `google-${externalIdCounter++}`,
          externalProvider: 'google',
          createdBy: ownerUser?.id,
        },
      })

      allOffboarded.push({ ...employee, orgId: org.id })
    }
  }

  // Keep backward compatibility references for Acme (used in subscription/alert seeding below)
  const acmeEmployees = allEmployees.filter(e => e.orgId === acmeOrg.id).slice(0, 5)
  const acmeOffboarded = allOffboarded.filter(e => e.orgId === acmeOrg.id).slice(0, 2)

  console.log(`✓ Created ${allEmployees.length} active employees and ${allOffboarded.length} offboarded employees across all organizations\n`)

  // ============================================================================
  // INTEGRATIONS
  // ============================================================================
  console.log('🔌 Seeding integrations...')

  const acmeGoogleIntegration = await prisma.integration.create({
    data: {
      organizationId: acmeOrg.id,
      provider: 'google',
      name: 'Google Workspace',
      status: 'active',
      encryptedCredentials: 'encrypted-google-credentials-placeholder',
      config: {
        syncEnabled: true,
        syncIntervalMinutes: 60,
      },
      providerConfig: {
        domain: 'acme.com',
        adminEmail: 'admin@acme.com',
      },
      lastSyncAt: randomPastDate(1),
      lastSyncStatus: 'success',
      syncStats: {
        employeesSynced: acmeEmployees.length + acmeOffboarded.length,
        lastSyncDuration: 3.2,
      },
      createdBy: users[0].id,
    },
  })

  const acmeOktaIntegration = await prisma.integration.create({
    data: {
      organizationId: acmeOrg.id,
      provider: 'okta',
      name: 'Okta SSO',
      status: 'active',
      encryptedCredentials: 'encrypted-okta-credentials-placeholder',
      config: {
        syncEnabled: true,
        syncIntervalMinutes: 30,
      },
      providerConfig: {
        domain: 'acme.okta.com',
      },
      lastSyncAt: randomPastDate(1),
      lastSyncStatus: 'success',
      syncStats: {
        loginEventsSynced: 1247,
        lastSyncDuration: 5.1,
      },
      createdBy: users[0].id,
    },
  })

  console.log('✓ Created integrations\n')

  // ============================================================================
  // SUBSCRIPTIONS
  // ============================================================================
  console.log('💳 Seeding subscriptions...')

  const acmeSubscriptions = [
    // Active, well-utilized
    {
      name: 'Slack',
      vendor: 'Slack Technologies',
      category: 'communication' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(32.50),
      totalMonthlyCost: toCents(650), // 20 seats
      annualValue: toCents(7800),
      totalSeats: 20,
      usedSeats: 18,
      startDate: randomPastDate(365),
      renewalDate: futureDate(45),
      autoRenew: true,
      ownerId: acmeEmployees[0].id,
      departmentId: acmeEngineering.id,
      integrationId: acmeOktaIntegration.id,
      ssoAppId: 'okta-slack-app-123',
      usagePercentage: 90,
    },
    // Active, but underutilized (should trigger alert)
    {
      name: 'GitHub',
      vendor: 'GitHub Inc.',
      category: 'development' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(21),
      totalMonthlyCost: toCents(420), // 20 seats
      annualValue: toCents(5040),
      totalSeats: 20,
      usedSeats: 8,
      startDate: randomPastDate(200),
      renewalDate: futureDate(165),
      autoRenew: true,
      ownerId: acmeEmployees[0].id,
      departmentId: acmeEngineering.id,
      integrationId: acmeOktaIntegration.id,
      ssoAppId: 'okta-github-app-456',
      usagePercentage: 40,
    },
    // Design tools
    {
      name: 'Figma',
      vendor: 'Figma Inc.',
      category: 'design' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(75),
      totalMonthlyCost: toCents(450), // 6 seats
      annualValue: toCents(5400),
      totalSeats: 6,
      usedSeats: 5,
      startDate: randomPastDate(180),
      renewalDate: futureDate(185),
      autoRenew: true,
      ownerId: acmeEmployees[3].id,
      departmentId: acmeDesign.id,
      integrationId: acmeOktaIntegration.id,
      ssoAppId: 'okta-figma-app-789',
      usagePercentage: 83,
    },
    // Communication - duplicate tool (Zoom AND Google Meet)
    {
      name: 'Zoom',
      vendor: 'Zoom Video Communications',
      category: 'communication' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(75),
      totalMonthlyCost: toCents(1500), // 20 seats
      annualValue: toCents(18000),
      totalSeats: 20,
      usedSeats: 12,
      startDate: randomPastDate(300),
      renewalDate: futureDate(65),
      autoRenew: true,
      ownerId: acmeEmployees[0].id,
      usagePercentage: 60,
    },
    // Renewal coming soon (should trigger alert)
    {
      name: 'Notion',
      vendor: 'Notion Labs',
      category: 'productivity' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(40),
      totalMonthlyCost: toCents(800), // 20 seats
      annualValue: toCents(9600),
      totalSeats: 20,
      usedSeats: 17,
      startDate: randomPastDate(335),
      renewalDate: futureDate(25), // Renews in 25 days
      autoRenew: true,
      ownerId: acmeEmployees[0].id,
      usagePercentage: 85,
    },
    // Infrastructure
    {
      name: 'AWS',
      vendor: 'Amazon Web Services',
      category: 'infrastructure' as const,
      status: 'active' as const,
      contractType: 'enterprise' as const,
      billingCycle: 'monthly' as const,
      pricingModel: 'usage_based' as const,
      totalMonthlyCost: toCents(3500),
      annualValue: toCents(42000),
      seatsUnlimited: true,
      startDate: randomPastDate(500),
      renewalDate: futureDate(30),
      autoRenew: true,
      ownerId: acmeEmployees[0].id,
      departmentId: acmeEngineering.id,
      usagePercentage: 100,
    },
    // Sales tools
    {
      name: 'HubSpot',
      vendor: 'HubSpot',
      category: 'sales_marketing' as const,
      status: 'active' as const,
      contractType: 'saas' as const,
      billingCycle: 'annual' as const,
      pricingModel: 'tiered' as const,
      totalMonthlyCost: toCents(1800),
      annualValue: toCents(21600),
      totalSeats: 5,
      usedSeats: 5,
      startDate: randomPastDate(250),
      renewalDate: futureDate(115),
      autoRenew: true,
      ownerId: acmeEmployees[4].id,
      departmentId: acmeSales.id,
      integrationId: acmeOktaIntegration.id,
      ssoAppId: 'okta-hubspot-app-999',
      usagePercentage: 100,
    },
    // Trial ending soon
    {
      name: 'Linear',
      vendor: 'Linear',
      category: 'productivity' as const,
      status: 'trial' as const,
      contractType: 'trial' as const,
      billingCycle: 'monthly' as const,
      pricingModel: 'per_seat' as const,
      pricePerUnit: toCents(40),
      totalMonthlyCost: toCents(400),
      totalSeats: 10,
      usedSeats: 6,
      startDate: randomPastDate(20),
      renewalDate: futureDate(10),
      trialEndDate: futureDate(10),
      autoRenew: false,
      ownerId: acmeEmployees[0].id,
      departmentId: acmeEngineering.id,
      usagePercentage: 60,
    },
  ]

  const createdAcmeSubscriptions = []
  for (const sub of acmeSubscriptions) {
    const created = await prisma.subscription.create({
      data: {
        organizationId: acmeOrg.id,
        ...sub,
        createdBy: users[0].id,
      },
    })
    createdAcmeSubscriptions.push(created)
  }

  console.log(`✓ Created ${createdAcmeSubscriptions.length} subscriptions\n`)

  // ============================================================================
  // SUBSCRIPTION USERS (License assignments)
  // ============================================================================
  console.log('🎫 Seeding subscription assignments...')

  const assignments = []

  // Slack - all active employees + 2 offboarded (orphaned licenses)
  for (const emp of acmeEmployees) {
    assignments.push({
      subscriptionId: createdAcmeSubscriptions[0].id, // Slack
      employeeId: emp.id,
      status: 'active' as const,
      assignedBy: users[0].id,
      lastUsedAt: randomPastDate(3),
      usageCount: Math.floor(Math.random() * 100) + 50,
    })
  }
  // Offboarded employees still have Slack (orphaned licenses)
  for (const emp of acmeOffboarded) {
    assignments.push({
      subscriptionId: createdAcmeSubscriptions[0].id, // Slack
      employeeId: emp.id,
      status: 'active' as const,
      assignedBy: users[0].id,
      lastUsedAt: randomPastDate(30), // Not used since offboarding
      usageCount: 20,
    })
  }

  // GitHub - only engineering team (8 people out of 20 seats)
  for (const emp of acmeEmployees.filter((_, i) => i < 3)) {
    assignments.push({
      subscriptionId: createdAcmeSubscriptions[1].id, // GitHub
      employeeId: emp.id,
      status: 'active' as const,
      assignedBy: users[0].id,
      lastUsedAt: randomPastDate(2),
      usageCount: Math.floor(Math.random() * 80) + 30,
    })
  }

  // Figma - design team + some frontend (5 active)
  assignments.push({
    subscriptionId: createdAcmeSubscriptions[2].id, // Figma
    employeeId: acmeEmployees[3].id, // Designer
    status: 'active' as const,
    assignedBy: users[0].id,
    lastUsedAt: randomPastDate(1),
    usageCount: 150,
  })
  assignments.push({
    subscriptionId: createdAcmeSubscriptions[2].id, // Figma
    employeeId: acmeEmployees[1].id, // Frontend eng
    status: 'active' as const,
    assignedBy: users[0].id,
    lastUsedAt: randomPastDate(1),
    usageCount: 80,
  })
  // One unused Figma license
  assignments.push({
    subscriptionId: createdAcmeSubscriptions[2].id, // Figma
    employeeId: acmeEmployees[2].id, // Backend eng
    status: 'active' as const,
    assignedBy: users[0].id,
    lastUsedAt: randomPastDate(45), // Not used for 45 days!
    usageCount: 5,
  })

  // HubSpot - sales team
  assignments.push({
    subscriptionId: createdAcmeSubscriptions[6].id, // HubSpot
    employeeId: acmeEmployees[4].id,
    status: 'active' as const,
    assignedBy: users[0].id,
    lastUsedAt: randomPastDate(1),
    usageCount: 200,
  })

  await prisma.subscriptionUser.createMany({
    data: assignments,
  })

  console.log(`✓ Created ${assignments.length} subscription assignments\n`)

  // ============================================================================
  // LOGIN EVENTS
  // ============================================================================
  console.log('📊 Seeding login events...')

  const loginEvents = []

  // Generate realistic login events for the past 30 days
  for (let day = 0; day < 30; day++) {
    // Slack - daily logins for active users
    for (const emp of acmeEmployees.slice(0, 4)) {
      loginEvents.push({
        organizationId: acmeOrg.id,
        employeeId: emp.id,
        subscriptionId: createdAcmeSubscriptions[0].id,
        integrationId: acmeOktaIntegration.id,
        eventType: 'user.authentication.sso',
        appName: 'Slack',
        appId: 'okta-slack-app-123',
        userEmail: emp.email,
        userName: emp.name,
        eventAt: randomPastDate(day + 1),
      })
    }

    // GitHub - less frequent
    if (day % 2 === 0) {
      for (const emp of acmeEmployees.slice(0, 3)) {
        loginEvents.push({
          organizationId: acmeOrg.id,
          employeeId: emp.id,
          subscriptionId: createdAcmeSubscriptions[1].id,
          integrationId: acmeOktaIntegration.id,
          eventType: 'user.authentication.sso',
          appName: 'GitHub',
          appId: 'okta-github-app-456',
          userEmail: emp.email,
          userName: emp.name,
          eventAt: randomPastDate(day + 1),
        })
      }
    }

    // Figma - design team
    if (day % 3 === 0) {
      loginEvents.push({
        organizationId: acmeOrg.id,
        employeeId: acmeEmployees[3].id,
        subscriptionId: createdAcmeSubscriptions[2].id,
        integrationId: acmeOktaIntegration.id,
        eventType: 'user.authentication.sso',
        appName: 'Figma',
        appId: 'okta-figma-app-789',
        userEmail: acmeEmployees[3].email,
        userName: acmeEmployees[3].name,
        eventAt: randomPastDate(day + 1),
      })
    }
  }

  await prisma.loginEvent.createMany({
    data: loginEvents,
  })

  console.log(`✓ Created ${loginEvents.length} login events\n`)

  // ============================================================================
  // ALERTS
  // ============================================================================
  console.log('🚨 Seeding alerts...')

  const alerts = [
    // Offboarding alerts
    {
      organizationId: acmeOrg.id,
      type: 'offboarding' as const,
      severity: 'critical' as const,
      status: 'pending' as const,
      title: `${acmeOffboarded[0].name} was offboarded but still has 1 active license`,
      description: `Employee ${acmeOffboarded[0].name} left the company 7 days ago but still has access to: Slack`,
      employeeId: acmeOffboarded[0].id,
      data: {
        offboardedAt: acmeOffboarded[0].offboardedAt,
        subscriptions: ['Slack'],
      },
      potentialSavings: toCents(32.50),
      alertKey: `offboarding-${acmeOffboarded[0].id}`,
    },
    {
      organizationId: acmeOrg.id,
      type: 'offboarding' as const,
      severity: 'critical' as const,
      status: 'pending' as const,
      title: `${acmeOffboarded[1].name} was offboarded but still has 1 active license`,
      description: `Employee ${acmeOffboarded[1].name} left the company 15 days ago but still has access to: Slack`,
      employeeId: acmeOffboarded[1].id,
      data: {
        offboardedAt: acmeOffboarded[1].offboardedAt,
        subscriptions: ['Slack'],
      },
      potentialSavings: toCents(32.50),
      alertKey: `offboarding-${acmeOffboarded[1].id}`,
    },
    // Unused license
    {
      organizationId: acmeOrg.id,
      type: 'unused_license' as const,
      severity: 'warning' as const,
      status: 'pending' as const,
      title: 'Figma license not used for 45 days',
      description: `${acmeEmployees[2].name} has a Figma license but hasn't logged in for 45 days`,
      employeeId: acmeEmployees[2].id,
      subscriptionId: createdAcmeSubscriptions[2].id,
      data: {
        lastUsedAt: randomPastDate(45),
        daysSinceLastUse: 45,
      },
      potentialSavings: toCents(75),
      alertKey: `unused-${createdAcmeSubscriptions[2].id}-${acmeEmployees[2].id}`,
    },
    // Low utilization
    {
      organizationId: acmeOrg.id,
      type: 'low_utilization' as const,
      severity: 'warning' as const,
      status: 'pending' as const,
      title: 'GitHub has low utilization (40%)',
      description: 'Only 8 out of 20 GitHub seats are being used',
      subscriptionId: createdAcmeSubscriptions[1].id,
      data: {
        totalSeats: 20,
        usedSeats: 8,
        utilizationRate: 40,
      },
      potentialSavings: toCents(252), // 12 unused seats * 21 BRL
      alertKey: `low-utilization-${createdAcmeSubscriptions[1].id}`,
    },
    // Renewal upcoming
    {
      organizationId: acmeOrg.id,
      type: 'renewal_upcoming' as const,
      severity: 'info' as const,
      status: 'pending' as const,
      title: 'Notion renewal in 25 days',
      description: 'Annual subscription for Notion will renew on ' + futureDate(25).toLocaleDateString(),
      subscriptionId: createdAcmeSubscriptions[4].id,
      data: {
        renewalDate: futureDate(25),
        daysUntilRenewal: 25,
        annualCost: 9600,
      },
      alertKey: `renewal-${createdAcmeSubscriptions[4].id}-25`,
    },
    // Trial ending
    {
      organizationId: acmeOrg.id,
      type: 'trial_ending' as const,
      severity: 'warning' as const,
      status: 'pending' as const,
      title: 'Linear trial ends in 10 days',
      description: 'Trial period for Linear ends soon. Decide whether to convert to paid or cancel.',
      subscriptionId: createdAcmeSubscriptions[7].id,
      data: {
        trialEndDate: futureDate(10),
        daysRemaining: 10,
        convertCost: 400,
      },
      alertKey: `trial-ending-${createdAcmeSubscriptions[7].id}`,
    },
    // Duplicate tool (resolved example)
    {
      organizationId: acmeOrg.id,
      type: 'duplicate_tool' as const,
      severity: 'warning' as const,
      status: 'resolved' as const,
      title: 'Duplicate communication tools detected',
      description: 'You have both Zoom and Google Meet. Consider consolidating.',
      data: {
        tools: ['Zoom', 'Google Meet'],
        category: 'communication',
      },
      potentialSavings: toCents(1500),
      resolvedAt: randomPastDate(3),
      resolvedBy: users[0].id,
      resolutionNotes: 'Decided to keep Zoom for now, Google Meet is free with Workspace',
      alertKey: 'duplicate-communication-zoom-meet',
    },
  ]

  await prisma.alert.createMany({
    data: alerts,
  })

  console.log(`✓ Created ${alerts.length} alerts\n`)

  // ============================================================================
  // COST HISTORY
  // ============================================================================
  console.log('📈 Seeding cost history...')

  const costHistoryEntries = []

  // Generate monthly snapshots for the past 12 months
  for (let month = 0; month < 12; month++) {
    const yearMonth = new Date()
    yearMonth.setMonth(yearMonth.getMonth() - month)
    yearMonth.setDate(1)

    const totalCost = toCents(9120 + (Math.random() * 500 - 250)) // ~9120 BRL with variation

    costHistoryEntries.push({
      organizationId: acmeOrg.id,
      yearMonth,
      totalCost,
      totalSubscriptions: 8,
      totalEmployees: acmeEmployees.length + (month < 1 ? acmeOffboarded.length : 0),
      totalSeats: 101,
      usedSeats: 75,
      costByCategory: {
        communication: 2150,
        development: 420,
        design: 450,
        infrastructure: 3500,
        sales_marketing: 1800,
        productivity: 1200,
      },
      costByDepartment: {
        Engineering: 5500,
        Design: 450,
        Sales: 1800,
        Operations: 1370,
      },
      potentialSavings: toCents(400 + Math.random() * 200),
      realizedSavings: month > 0 ? toCents(150 + Math.random() * 100) : null,
    })
  }

  await prisma.costHistory.createMany({
    data: costHistoryEntries,
  })

  console.log(`✓ Created ${costHistoryEntries.length} cost history entries\n`)

  // ============================================================================
  // SYNC LOGS
  // ============================================================================
  console.log('🔄 Seeding sync logs...')

  const syncLogs = []

  // Google Workspace syncs (daily for past 7 days)
  for (let day = 0; day < 7; day++) {
    syncLogs.push({
      organizationId: acmeOrg.id,
      integrationId: acmeGoogleIntegration.id,
      syncType: 'employees',
      status: 'success',
      stats: {
        employeesAdded: 0,
        employeesUpdated: Math.floor(Math.random() * 3),
        employeesRemoved: day === 1 ? 1 : 0, // One removal 1 day ago
      },
      startedAt: randomPastDate(day),
      completedAt: randomPastDate(day),
      triggeredBy: users[0].id,
    })
  }

  // Okta syncs (twice daily for past 3 days)
  for (let day = 0; day < 3; day++) {
    for (let sync = 0; sync < 2; sync++) {
      syncLogs.push({
        organizationId: acmeOrg.id,
        integrationId: acmeOktaIntegration.id,
        syncType: 'login_events',
        status: 'success',
        stats: {
          eventsProcessed: Math.floor(Math.random() * 100) + 50,
          eventsFailed: 0,
        },
        startedAt: randomPastDate(day),
        completedAt: randomPastDate(day),
        triggeredBy: users[0].id,
      })
    }
  }

  await prisma.syncLog.createMany({
    data: syncLogs,
  })

  console.log(`✓ Created ${syncLogs.length} sync logs\n`)

  console.log('✅ Database seeding completed successfully!\n')
  console.log('Summary:')
  console.log(`  - ${organizations.length} organizations`)
  console.log(`  - ${users.length} platform users`)
  console.log(`  - ${totalDepts} departments (with hierarchy)`)
  console.log(`  - ${allEmployees.length} active employees`)
  console.log(`  - ${allOffboarded.length} offboarded employees`)
  console.log(`  - ${createdAcmeSubscriptions.length} subscriptions (for primary org)`)
  console.log(`  - ${assignments.length} license assignments`)
  console.log(`  - ${loginEvents.length} login events`)
  console.log(`  - ${alerts.length} alerts (various types and statuses)`)
  console.log(`  - ${costHistoryEntries.length} cost history entries`)
  console.log(`  - ${syncLogs.length} sync logs`)
  console.log(`  - ${catalogTools.length} SaaS catalog entries`)
  console.log('\nOrganization breakdown:')
  organizations.forEach(org => {
    const empCount = allEmployees.filter(e => e.orgId === org.id).length
    const offCount = allOffboarded.filter(e => e.orgId === org.id).length
    console.log(`  - ${org.name}: ${empCount} active, ${offCount} offboarded`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    await pool.end()
    process.exit(1)
  })
