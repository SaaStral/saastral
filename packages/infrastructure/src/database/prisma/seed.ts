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

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Initialize Prisma with adapter
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

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

  const acmeOrg = await prisma.organization.create({
    data: {
      name: 'Acme Corporation',
      slug: 'acme',
      domain: 'acme.com',
      plan: 'business',
      planStartedAt: randomPastDate(90),
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

  const techStartup = await prisma.organization.create({
    data: {
      name: 'TechStartup Inc',
      slug: 'techstartup',
      domain: 'techstartup.io',
      plan: 'team',
      planStartedAt: randomPastDate(30),
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        alertDefaults: {
          unusedLicenseDays: 45,
          lowUtilizationThreshold: 40,
          renewalReminderDays: [30, 15, 7],
        },
      },
    },
  })

  console.log(`✓ Created 2 organizations\n`)

  // ============================================================================
  // USERS
  // ============================================================================
  console.log('👤 Seeding users...')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@acme.com',
        name: 'John Doe',
        emailVerifiedAt: randomPastDate(60),
        lastLoginAt: randomPastDate(1),
        preferences: { language: 'pt-BR', notifications: { email: true, inApp: true } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@acme.com',
        name: 'Jane Smith',
        emailVerifiedAt: randomPastDate(60),
        lastLoginAt: randomPastDate(2),
        preferences: { language: 'pt-BR', notifications: { email: true, inApp: true } },
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.johnson@techstartup.io',
        name: 'Mike Johnson',
        emailVerifiedAt: randomPastDate(25),
        lastLoginAt: randomPastDate(1),
        preferences: { language: 'en-US', notifications: { email: true, inApp: false } },
      },
    }),
  ])

  console.log(`✓ Created ${users.length} users\n`)

  // ============================================================================
  // ORGANIZATION MEMBERS
  // ============================================================================
  console.log('👥 Seeding organization members...')

  await Promise.all([
    prisma.organizationMember.create({
      data: {
        organizationId: acmeOrg.id,
        userId: users[0].id,
        role: 'owner',
        acceptedAt: randomPastDate(60),
      },
    }),
    prisma.organizationMember.create({
      data: {
        organizationId: acmeOrg.id,
        userId: users[1].id,
        role: 'admin',
        invitedBy: users[0].id,
        acceptedAt: randomPastDate(55),
      },
    }),
    prisma.organizationMember.create({
      data: {
        organizationId: techStartup.id,
        userId: users[2].id,
        role: 'owner',
        acceptedAt: randomPastDate(30),
      },
    }),
  ])

  console.log('✓ Created organization memberships\n')

  // ============================================================================
  // DEPARTMENTS
  // ============================================================================
  console.log('🏛️ Seeding departments...')

  // Acme departments
  const acmeEngineering = await prisma.department.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Engineering',
      description: 'Product development and infrastructure',
    },
  })

  const acmeFrontend = await prisma.department.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Frontend',
      description: 'Frontend development team',
      parentId: acmeEngineering.id,
    },
  })

  const acmeBackend = await prisma.department.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Backend',
      description: 'Backend development team',
      parentId: acmeEngineering.id,
    },
  })

  const acmeDesign = await prisma.department.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Design',
      description: 'Product design and UX',
    },
  })

  const acmeSales = await prisma.department.create({
    data: {
      organizationId: acmeOrg.id,
      name: 'Sales',
      description: 'Sales and business development',
    },
  })

  // TechStartup departments
  const techEngineering = await prisma.department.create({
    data: {
      organizationId: techStartup.id,
      name: 'Engineering',
      description: 'Full-stack development',
    },
  })

  console.log('✓ Created departments with hierarchy\n')

  // ============================================================================
  // EMPLOYEES
  // ============================================================================
  console.log('👨‍💼 Seeding employees...')

  // Acme employees (active)
  const acmeEmployees = await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Alice Johnson',
        email: 'alice.johnson@acme.com',
        title: 'VP of Engineering',
        status: 'active',
        departmentId: acmeEngineering.id,
        hiredAt: randomPastDate(730),
        externalId: 'google-123456',
        externalProvider: 'google',
        monthlySaasCost: toCents(450),
        createdBy: users[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Bob Martinez',
        email: 'bob.martinez@acme.com',
        title: 'Senior Frontend Engineer',
        status: 'active',
        departmentId: acmeFrontend.id,
        hiredAt: randomPastDate(365),
        externalId: 'google-123457',
        externalProvider: 'google',
        monthlySaasCost: toCents(320),
        createdBy: users[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Carol White',
        email: 'carol.white@acme.com',
        title: 'Backend Engineer',
        status: 'active',
        departmentId: acmeBackend.id,
        hiredAt: randomPastDate(180),
        externalId: 'google-123458',
        externalProvider: 'google',
        monthlySaasCost: toCents(280),
        createdBy: users[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'David Chen',
        email: 'david.chen@acme.com',
        title: 'Product Designer',
        status: 'active',
        departmentId: acmeDesign.id,
        hiredAt: randomPastDate(270),
        externalId: 'google-123459',
        externalProvider: 'google',
        monthlySaasCost: toCents(190),
        createdBy: users[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Emily Davis',
        email: 'emily.davis@acme.com',
        title: 'Sales Manager',
        status: 'active',
        departmentId: acmeSales.id,
        hiredAt: randomPastDate(450),
        externalId: 'google-123460',
        externalProvider: 'google',
        monthlySaasCost: toCents(220),
        createdBy: users[0].id,
      },
    }),
  ])

  // Acme employees (offboarded - for testing orphaned licenses)
  const acmeOffboarded = await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Frank Wilson',
        email: 'frank.wilson@acme.com',
        title: 'Former Engineer',
        status: 'offboarded',
        departmentId: acmeBackend.id,
        hiredAt: randomPastDate(500),
        offboardedAt: randomPastDate(7),
        externalId: 'google-123461',
        externalProvider: 'google',
        createdBy: users[0].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: acmeOrg.id,
        name: 'Grace Lee',
        email: 'grace.lee@acme.com',
        title: 'Former Designer',
        status: 'offboarded',
        departmentId: acmeDesign.id,
        hiredAt: randomPastDate(600),
        offboardedAt: randomPastDate(15),
        externalId: 'google-123462',
        externalProvider: 'google',
        createdBy: users[0].id,
      },
    }),
  ])

  // TechStartup employees
  const techEmployees = await Promise.all([
    prisma.employee.create({
      data: {
        organizationId: techStartup.id,
        name: 'Henry Kim',
        email: 'henry.kim@techstartup.io',
        title: 'CTO',
        status: 'active',
        departmentId: techEngineering.id,
        hiredAt: randomPastDate(200),
        externalId: 'google-234567',
        externalProvider: 'google',
        monthlySaasCost: toCents(380),
        createdBy: users[2].id,
      },
    }),
    prisma.employee.create({
      data: {
        organizationId: techStartup.id,
        name: 'Iris Patel',
        email: 'iris.patel@techstartup.io',
        title: 'Full-Stack Engineer',
        status: 'active',
        departmentId: techEngineering.id,
        hiredAt: randomPastDate(90),
        externalId: 'google-234568',
        externalProvider: 'google',
        monthlySaasCost: toCents(250),
        createdBy: users[2].id,
      },
    }),
  ])

  console.log(`✓ Created ${acmeEmployees.length + acmeOffboarded.length + techEmployees.length} employees (${acmeOffboarded.length} offboarded)\n`)

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
  console.log(`  - 2 organizations`)
  console.log(`  - ${users.length} platform users`)
  console.log(`  - 6 departments (with hierarchy)`)
  console.log(`  - ${acmeEmployees.length + acmeOffboarded.length + techEmployees.length} employees (${acmeOffboarded.length} offboarded)`)
  console.log(`  - ${createdAcmeSubscriptions.length} subscriptions`)
  console.log(`  - ${assignments.length} license assignments`)
  console.log(`  - ${loginEvents.length} login events`)
  console.log(`  - ${alerts.length} alerts (various types and statuses)`)
  console.log(`  - ${costHistoryEntries.length} cost history entries`)
  console.log(`  - ${syncLogs.length} sync logs`)
  console.log(`  - ${catalogTools.length} SaaS catalog entries`)
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
