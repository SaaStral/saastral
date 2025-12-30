import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { slug: 'demo-company' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo-company',
    },
  })

  console.log('✅ Created organization:', org.name)

  // Create departments
  const engineering = await prisma.department.upsert({
    where: { id: 'eng-dept' },
    update: {},
    create: {
      id: 'eng-dept',
      organizationId: org.id,
      name: 'Engineering',
      description: 'Software development team',
    },
  })

  const sales = await prisma.department.upsert({
    where: { id: 'sales-dept' },
    update: {},
    create: {
      id: 'sales-dept',
      organizationId: org.id,
      name: 'Sales',
      description: 'Sales and customer success',
    },
  })

  console.log('✅ Created departments')

  // Create employees
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { id: 'emp-1' },
      update: {},
      create: {
        id: 'emp-1',
        organizationId: org.id,
        departmentId: engineering.id,
        name: 'John Doe',
        email: 'john@democompany.com',
        status: 'active',
        hiredAt: new Date('2023-01-15'),
      },
    }),
    prisma.employee.upsert({
      where: { id: 'emp-2' },
      update: {},
      create: {
        id: 'emp-2',
        organizationId: org.id,
        departmentId: engineering.id,
        name: 'Jane Smith',
        email: 'jane@democompany.com',
        status: 'active',
        hiredAt: new Date('2023-03-20'),
      },
    }),
    prisma.employee.upsert({
      where: { id: 'emp-3' },
      update: {},
      create: {
        id: 'emp-3',
        organizationId: org.id,
        departmentId: sales.id,
        name: 'Bob Johnson',
        email: 'bob@democompany.com',
        status: 'offboarded',
        hiredAt: new Date('2022-06-10'),
        offboardedAt: new Date('2024-01-05'),
      },
    }),
  ])

  console.log(`✅ Created ${employees.length} employees`)

  // Create subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.upsert({
      where: { id: 'sub-1' },
      update: {},
      create: {
        id: 'sub-1',
        organizationId: org.id,
        name: 'GitHub',
        description: 'Code hosting and collaboration',
        category: 'Development',
        vendor: 'GitHub',
        status: 'active',
        monthlyCostCents: 2100, // $21/month
        currency: 'USD',
        billingCycle: 'monthly',
        totalSeats: 10,
        usedSeats: 8,
        nextRenewalAt: new Date('2024-02-01'),
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub-2' },
      update: {},
      create: {
        id: 'sub-2',
        organizationId: org.id,
        name: 'Slack',
        description: 'Team communication',
        category: 'Communication',
        vendor: 'Slack',
        status: 'active',
        monthlyCostCents: 6400, // $64/month
        currency: 'USD',
        billingCycle: 'monthly',
        totalSeats: 20,
        usedSeats: 15,
        nextRenewalAt: new Date('2024-02-15'),
      },
    }),
    prisma.subscription.upsert({
      where: { id: 'sub-3' },
      update: {},
      create: {
        id: 'sub-3',
        organizationId: org.id,
        name: 'Figma',
        description: 'Design and prototyping',
        category: 'Design',
        vendor: 'Figma',
        status: 'active',
        monthlyCostCents: 4500, // $45/month
        currency: 'USD',
        billingCycle: 'monthly',
        totalSeats: 5,
        usedSeats: 3,
        nextRenewalAt: new Date('2024-01-25'),
      },
    }),
  ])

  console.log(`✅ Created ${subscriptions.length} subscriptions`)

  // Create subscription members
  await prisma.subscriptionMember.createMany({
    data: [
      {
        subscriptionId: subscriptions[0].id,
        employeeId: employees[0].id,
        role: 'admin',
        lastUsedAt: new Date(),
      },
      {
        subscriptionId: subscriptions[0].id,
        employeeId: employees[1].id,
        role: 'user',
        lastUsedAt: new Date(),
      },
      {
        subscriptionId: subscriptions[1].id,
        employeeId: employees[0].id,
        role: 'user',
        lastUsedAt: new Date(),
      },
      {
        subscriptionId: subscriptions[1].id,
        employeeId: employees[1].id,
        role: 'user',
        lastUsedAt: new Date(),
      },
      {
        subscriptionId: subscriptions[2].id,
        employeeId: employees[1].id,
        role: 'admin',
        lastUsedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Created subscription members')

  // Create sample alerts
  await prisma.alert.createMany({
    data: [
      {
        organizationId: org.id,
        type: 'offboarding',
        severity: 'high',
        status: 'pending',
        title: 'Offboarded employee still has active licenses',
        message: `Bob Johnson was offboarded on 2024-01-05 but still has 2 active licenses.`,
        metadata: {
          employeeId: employees[2].id,
          employeeName: 'Bob Johnson',
          licenseCount: 2,
        },
      },
      {
        organizationId: org.id,
        subscriptionId: subscriptions[2].id,
        type: 'unused_license',
        severity: 'medium',
        status: 'pending',
        title: 'Figma license not used in 30 days',
        message: 'A Figma license has not been used in the last 30 days.',
        metadata: {
          subscriptionId: subscriptions[2].id,
          daysSinceLastUse: 30,
        },
      },
      {
        organizationId: org.id,
        subscriptionId: subscriptions[0].id,
        type: 'renewal_soon',
        severity: 'low',
        status: 'pending',
        title: 'GitHub renewal in 15 days',
        message: 'GitHub subscription will renew on 2024-02-01',
        metadata: {
          subscriptionId: subscriptions[0].id,
          renewalDate: '2024-02-01',
        },
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Created sample alerts')

  console.log('\n🎉 Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
