import { z } from 'zod'
import { router, publicProcedure } from '../trpc'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Initialize Prisma
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saastral',
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Input schema for creating an organization
const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  userId: z.string().uuid(), // BetterAuth now generates UUIDs
})

export const organizationRouter = router({
  /**
   * Create a new organization and make the user an owner
   */
  create: publicProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input }) => {
      const { name, userId } = input

      // Generate slug from name (simple version)
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Create organization
      const organization = await prisma.organization.create({
        data: {
          name,
          slug,
          plan: 'team', // Default plan
          planStartedAt: new Date(),
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

      // Create organization membership (make user owner)
      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'owner',
          acceptedAt: new Date(),
        },
      })

      return {
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
      }
    }),
})
