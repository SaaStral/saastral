/**
 * Integration Tests for PrismaAlertRepository
 *
 * Tests alert persistence with real PostgreSQL database.
 * Covers CRUD operations, filtering, aggregation, and deduplication.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaAlertRepository } from './alert.repository'
import { Alert } from '@saastral/core'
import { getPrismaClient } from '../../../test/db-setup'

describe('PrismaAlertRepository', () => {
  let prisma: PrismaClient
  let repository: PrismaAlertRepository
  let orgId: string
  let userId: string
  let employeeId: string
  let subscriptionId: string

  beforeEach(async () => {
    prisma = getPrismaClient()
    repository = new PrismaAlertRepository(prisma)

    // Create test user (required for foreign key constraints on acknowledged_by, resolved_by, etc.)
    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random()}`,
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    userId = user.id

    // Create test organization
    const org = await prisma.organization.create({
      data: {
        id: `org-${Date.now()}-${Math.random()}`,
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    orgId = org.id

    // Create test employee
    const employee = await prisma.employee.create({
      data: {
        id: `emp-${Date.now()}-${Math.random()}`,
        organizationId: orgId,
        name: 'John Doe',
        email: 'john@example.com',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    employeeId = employee.id

    // Create test subscription
    const subscription = await prisma.subscription.create({
      data: {
        id: `sub-${Date.now()}-${Math.random()}`,
        organizationId: orgId,
        name: 'Slack',
        category: 'communication',
        status: 'active',
        totalSeats: 10,
        usedSeats: 5,
        pricePerUnit: 1000n,
        totalMonthlyCost: 10000n,
        billingCycle: 'monthly',
        pricingModel: 'per_seat',
        currency: 'BRL',
        startDate: new Date(),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    subscriptionId = subscription.id
  })

  describe('save', () => {
    it('should persist new alert', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Employee offboarded with active licenses',
        description: 'John Doe left but still has 3 licenses',
        employeeId,
        potentialSavings: 30000n,
        currency: 'BRL',
        alertKey: `offboarding:${employeeId}`,
      })

      await repository.save(alert)

      const dbRecord = await prisma.alert.findUnique({
        where: { id: alert.id },
      })

      expect(dbRecord).not.toBeNull()
      expect(dbRecord?.organizationId).toBe(orgId)
      expect(dbRecord?.type).toBe('offboarding')
      expect(dbRecord?.severity).toBe('critical')
      expect(dbRecord?.status).toBe('pending')
      expect(dbRecord?.title).toBe('Employee offboarded with active licenses')
      expect(dbRecord?.employeeId).toBe(employeeId)
      expect(dbRecord?.potentialSavings).toBe(30000n)
      expect(dbRecord?.alertKey).toBe(`offboarding:${employeeId}`)
    })

    it('should update existing alert (upsert)', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Slack renewal in 30 days',
        subscriptionId,
        alertKey: `renewal:${subscriptionId}`,
      })

      const saved = await repository.save(alert)

      // Acknowledge the alert
      saved.acknowledge(userId)

      const updated = await repository.save(saved)

      expect(updated.status).toBe('acknowledged')
      expect(updated.acknowledgedBy).toBe(userId)
    })

    it('should handle all optional fields', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'cost_anomaly',
        severity: 'warning',
        title: 'Unusual cost increase',
        description: 'Cost increased by 50%',
        subscriptionId,
        data: { previousCost: 10000, currentCost: 15000 },
        potentialSavings: 5000n,
        currency: 'BRL',
        alertKey: `cost_anomaly:${subscriptionId}`,
      })

      const saved = await repository.save(alert)

      expect(saved.description).toBe('Cost increased by 50%')
      expect(saved.data).toEqual({
        previousCost: 10000,
        currentCost: 15000,
      })
      expect(saved.potentialSavings).toBe(5000n)
      expect(saved.currency).toBe('BRL')
    })
  })

  describe('findById', () => {
    it('should find alert by id', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'unused_license',
        severity: 'warning',
        title: 'License not used for 30 days',
        employeeId,
        subscriptionId,
        alertKey: `unused:${employeeId}:${subscriptionId}`,
      })

      await repository.save(alert)

      const found = await repository.findById(alert.id)

      expect(found).not.toBeNull()
      expect(found?.id).toBe(alert.id)
      expect(found?.type).toBe('unused_license')
    })

    it('should return null when alert not found', async () => {
      const result = await repository.findById('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('findByAlertKey', () => {
    it('should find alert by alert key', async () => {
      const alertKey = `offboarding:${employeeId}`

      const alert = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Employee offboarded',
        employeeId,
        alertKey,
      })

      await repository.save(alert)

      const found = await repository.findByAlertKey(orgId, alertKey)

      expect(found).not.toBeNull()
      expect(found?.alertKey).toBe(alertKey)
      expect(found?.type).toBe('offboarding')
    })

    it('should return null when alert key not found', async () => {
      const result = await repository.findByAlertKey(orgId, 'non-existent-key')
      expect(result).toBeNull()
    })

    it('should respect organization boundary', async () => {
      const alertKey = `offboarding:${employeeId}`

      const alert = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Employee offboarded',
        employeeId,
        alertKey,
      })

      await repository.save(alert)

      // Try to find with different org ID
      const found = await repository.findByAlertKey('other-org', alertKey)
      expect(found).toBeNull()
    })
  })

  describe('findPendingByOrganization', () => {
    it('should find all pending alerts ordered by severity and date', async () => {
      // Create alerts with different severities
      const critical = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Critical alert',
      })

      const warning = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Warning alert',
      })

      const info = Alert.create({
        organizationId: orgId,
        type: 'trial_ending',
        severity: 'info',
        title: 'Info alert',
      })

      await repository.save(info)
      await repository.save(warning)
      await repository.save(critical)

      const alerts = await repository.findPendingByOrganization(orgId)

      expect(alerts).toHaveLength(3)
      // Should be ordered by severity (critical first)
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[1].severity).toBe('warning')
      expect(alerts[2].severity).toBe('info')
    })

    it('should not include acknowledged alerts', async () => {
      const pending = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Pending alert',
      })

      const acknowledged = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Acknowledged alert',
      })
      acknowledged.acknowledge(userId)

      await repository.save(pending)
      await repository.save(acknowledged)

      const alerts = await repository.findPendingByOrganization(orgId)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].status).toBe('pending')
    })
  })

  describe('find (with filters)', () => {
    beforeEach(async () => {
      // Create diverse alerts for filtering tests
      const alerts = [
        Alert.create({
          organizationId: orgId,
          type: 'offboarding',
          severity: 'critical',
          title: 'Offboarding alert',
          employeeId,
        }),
        Alert.create({
          organizationId: orgId,
          type: 'renewal_upcoming',
          severity: 'warning',
          title: 'Renewal alert',
          subscriptionId,
        }),
        Alert.create({
          organizationId: orgId,
          type: 'unused_license',
          severity: 'info',
          title: 'Unused license',
          employeeId,
          subscriptionId,
        }),
      ]

      alerts[1].acknowledge(userId)
      alerts[2].resolve(userId, 'Fixed')

      for (const alert of alerts) {
        await repository.save(alert)
      }
    })

    it('should filter by status', async () => {
      const pending = await repository.find({
        organizationId: orgId,
        status: 'pending',
      })

      expect(pending).toHaveLength(1)
      expect(pending[0].status).toBe('pending')
    })

    it('should filter by multiple statuses', async () => {
      const alerts = await repository.find({
        organizationId: orgId,
        status: ['pending', 'acknowledged'],
      })

      expect(alerts).toHaveLength(2)
    })

    it('should filter by severity', async () => {
      const critical = await repository.find({
        organizationId: orgId,
        severity: 'critical',
      })

      expect(critical).toHaveLength(1)
      expect(critical[0].severity).toBe('critical')
    })

    it('should filter by type', async () => {
      const offboarding = await repository.find({
        organizationId: orgId,
        type: 'offboarding',
      })

      expect(offboarding).toHaveLength(1)
      expect(offboarding[0].type).toBe('offboarding')
    })

    it('should filter by employeeId', async () => {
      const alerts = await repository.find({
        organizationId: orgId,
        employeeId,
      })

      expect(alerts.length).toBeGreaterThan(0)
      alerts.forEach((alert) => {
        expect(alert.employeeId).toBe(employeeId)
      })
    })

    it('should filter by subscriptionId', async () => {
      const alerts = await repository.find({
        organizationId: orgId,
        subscriptionId,
      })

      expect(alerts.length).toBeGreaterThan(0)
      alerts.forEach((alert) => {
        expect(alert.subscriptionId).toBe(subscriptionId)
      })
    })

    it('should exclude resolved by default', async () => {
      const alerts = await repository.find({
        organizationId: orgId,
      })

      const resolved = alerts.filter((a) => a.status === 'resolved')
      expect(resolved).toHaveLength(0)
    })

    it('should include resolved when requested', async () => {
      const alerts = await repository.find({
        organizationId: orgId,
        includeResolved: true,
      })

      const resolved = alerts.filter((a) => a.status === 'resolved')
      expect(resolved).toHaveLength(1)
    })

    it('should support pagination', async () => {
      const page1 = await repository.find({
        organizationId: orgId,
        includeResolved: true,
        limit: 2,
        offset: 0,
      })

      const page2 = await repository.find({
        organizationId: orgId,
        includeResolved: true,
        limit: 2,
        offset: 2,
      })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).not.toBe(page2[0].id)
    })
  })

  describe('findByEmployee', () => {
    it('should find all pending and acknowledged alerts for employee', async () => {
      const pending = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Offboarding alert',
        employeeId,
      })

      const acknowledged = Alert.create({
        organizationId: orgId,
        type: 'unused_license',
        severity: 'warning',
        title: 'Unused license',
        employeeId,
        subscriptionId,
      })
      acknowledged.acknowledge(userId)

      const resolved = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'info',
        title: 'Renewal alert',
        employeeId,
      })
      resolved.resolve(userId)

      await repository.save(pending)
      await repository.save(acknowledged)
      await repository.save(resolved)

      const alerts = await repository.findByEmployee(employeeId)

      expect(alerts).toHaveLength(2)
      expect(alerts.every((a) => a.employeeId === employeeId)).toBe(true)
      expect(alerts.some((a) => a.status === 'resolved')).toBe(false)
    })
  })

  describe('findBySubscription', () => {
    it('should find all pending and acknowledged alerts for subscription', async () => {
      const pending = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Renewal alert',
        subscriptionId,
      })

      const acknowledged = Alert.create({
        organizationId: orgId,
        type: 'low_utilization',
        severity: 'info',
        title: 'Low utilization',
        subscriptionId,
      })
      acknowledged.acknowledge(userId)

      await repository.save(pending)
      await repository.save(acknowledged)

      const alerts = await repository.findBySubscription(subscriptionId)

      expect(alerts).toHaveLength(2)
      expect(alerts.every((a) => a.subscriptionId === subscriptionId)).toBe(
        true,
      )
    })
  })

  describe('findCriticalByOrganization', () => {
    it('should find only critical pending/acknowledged alerts', async () => {
      const critical = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Critical alert',
      })

      const warning = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Warning alert',
      })

      const resolvedCritical = Alert.create({
        organizationId: orgId,
        type: 'seat_shortage',
        severity: 'critical',
        title: 'Resolved critical',
      })
      resolvedCritical.resolve(userId)

      await repository.save(critical)
      await repository.save(warning)
      await repository.save(resolvedCritical)

      const alerts = await repository.findCriticalByOrganization(orgId)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].severity).toBe('critical')
      expect(alerts[0].status).toBe('pending')
    })
  })

  describe('countByStatus', () => {
    it('should count alerts by status', async () => {
      const pending1 = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Pending 1',
      })

      const pending2 = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Pending 2',
      })

      const acknowledged = Alert.create({
        organizationId: orgId,
        type: 'unused_license',
        severity: 'info',
        title: 'Acknowledged',
      })
      acknowledged.acknowledge(userId)

      const resolved = Alert.create({
        organizationId: orgId,
        type: 'low_utilization',
        severity: 'info',
        title: 'Resolved',
      })
      resolved.resolve(userId)

      const dismissed = Alert.create({
        organizationId: orgId,
        type: 'trial_ending',
        severity: 'info',
        title: 'Dismissed',
      })
      dismissed.dismiss(userId, 'Not relevant')

      await repository.save(pending1)
      await repository.save(pending2)
      await repository.save(acknowledged)
      await repository.save(resolved)
      await repository.save(dismissed)

      const counts = await repository.countByStatus(orgId)

      expect(counts.pending).toBe(2)
      expect(counts.acknowledged).toBe(1)
      expect(counts.resolved).toBe(1)
      expect(counts.dismissed).toBe(1)
    })

    it('should return zero counts for org with no alerts', async () => {
      const counts = await repository.countByStatus('empty-org')

      expect(counts.pending).toBe(0)
      expect(counts.acknowledged).toBe(0)
      expect(counts.resolved).toBe(0)
      expect(counts.dismissed).toBe(0)
    })
  })

  describe('calculatePotentialSavings', () => {
    it('should sum potential savings from pending and acknowledged alerts', async () => {
      const alert1 = Alert.create({
        organizationId: orgId,
        type: 'offboarding',
        severity: 'critical',
        title: 'Alert 1',
        potentialSavings: 10000n,
        currency: 'BRL',
      })

      const alert2 = Alert.create({
        organizationId: orgId,
        type: 'unused_license',
        severity: 'warning',
        title: 'Alert 2',
        potentialSavings: 5000n,
        currency: 'BRL',
      })

      const acknowledged = Alert.create({
        organizationId: orgId,
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Alert 3',
        potentialSavings: 3000n,
        currency: 'BRL',
      })
      acknowledged.acknowledge(userId)

      const resolved = Alert.create({
        organizationId: orgId,
        type: 'low_utilization',
        severity: 'info',
        title: 'Alert 4',
        potentialSavings: 2000n,
        currency: 'BRL',
      })
      resolved.resolve(userId)

      await repository.save(alert1)
      await repository.save(alert2)
      await repository.save(acknowledged)
      await repository.save(resolved)

      const total = await repository.calculatePotentialSavings(orgId)

      // Should sum pending and acknowledged (10000 + 5000 + 3000)
      expect(total).toBe(18000n)
    })

    it('should return zero when no alerts with savings', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'trial_ending',
        severity: 'info',
        title: 'No savings',
      })

      await repository.save(alert)

      const total = await repository.calculatePotentialSavings(orgId)
      expect(total).toBe(0n)
    })
  })

  describe('saveMany', () => {
    it('should save multiple alerts in transaction', async () => {
      const alerts = [
        Alert.create({
          organizationId: orgId,
          type: 'offboarding',
          severity: 'critical',
          title: 'Alert 1',
        }),
        Alert.create({
          organizationId: orgId,
          type: 'renewal_upcoming',
          severity: 'warning',
          title: 'Alert 2',
        }),
        Alert.create({
          organizationId: orgId,
          type: 'unused_license',
          severity: 'info',
          title: 'Alert 3',
        }),
      ]

      const saved = await repository.saveMany(alerts)

      expect(saved).toHaveLength(3)

      // Verify all alerts were persisted
      const dbCount = await prisma.alert.count({
        where: { organizationId: orgId },
      })
      expect(dbCount).toBe(3)
    })
  })

  describe('delete', () => {
    it('should delete alert', async () => {
      const alert = Alert.create({
        organizationId: orgId,
        type: 'trial_ending',
        severity: 'info',
        title: 'To be deleted',
      })

      await repository.save(alert)

      await repository.delete(alert.id)

      const found = await repository.findById(alert.id)
      expect(found).toBeNull()
    })
  })

  describe('deleteByOrganization', () => {
    it('should delete all alerts for organization', async () => {
      const alerts = [
        Alert.create({
          organizationId: orgId,
          type: 'offboarding',
          severity: 'critical',
          title: 'Alert 1',
        }),
        Alert.create({
          organizationId: orgId,
          type: 'renewal_upcoming',
          severity: 'warning',
          title: 'Alert 2',
        }),
      ]

      for (const alert of alerts) {
        await repository.save(alert)
      }

      await repository.deleteByOrganization(orgId)

      const remaining = await repository.find({
        organizationId: orgId,
        includeResolved: true,
        includeDismissed: true,
      })

      expect(remaining).toHaveLength(0)
    })
  })

  describe('deleteOldAlerts', () => {
    it('should delete resolved/dismissed alerts older than X days', async () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 40) // 40 days ago

      // Create old resolved alert
      const oldResolved = await prisma.alert.create({
        data: {
          id: `alert-${Date.now()}-1`,
          organizationId: orgId,
          type: 'offboarding',
          severity: 'critical',
          status: 'resolved',
          title: 'Old resolved',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
      })

      // Create old dismissed alert
      const oldDismissed = await prisma.alert.create({
        data: {
          id: `alert-${Date.now()}-2`,
          organizationId: orgId,
          type: 'renewal_upcoming',
          severity: 'warning',
          status: 'dismissed',
          title: 'Old dismissed',
          createdAt: oldDate,
          updatedAt: oldDate,
        },
      })

      // Create recent resolved alert
      const recentResolved = Alert.create({
        organizationId: orgId,
        type: 'unused_license',
        severity: 'info',
        title: 'Recent resolved',
      })
      recentResolved.resolve(userId)
      await repository.save(recentResolved)

      // Create pending alert (should not be deleted)
      const pending = Alert.create({
        organizationId: orgId,
        type: 'low_utilization',
        severity: 'info',
        title: 'Pending',
      })
      await repository.save(pending)

      const deletedCount = await repository.deleteOldAlerts(orgId, 30)

      expect(deletedCount).toBe(2) // Old resolved and old dismissed

      const remaining = await repository.find({
        organizationId: orgId,
        includeResolved: true,
        includeDismissed: true,
      })

      expect(remaining).toHaveLength(2) // Recent resolved and pending
    })
  })

  describe('domain transformation', () => {
    it('should correctly transform to and from domain', async () => {
      const now = new Date()

      const alert = Alert.create({
        organizationId: orgId,
        type: 'cost_anomaly',
        severity: 'warning',
        title: 'Cost increased',
        description: 'Monthly cost increased by 50%',
        subscriptionId,
        data: { previousCost: 10000, currentCost: 15000 },
        potentialSavings: 5000n,
        currency: 'BRL',
        alertKey: `cost_anomaly:${subscriptionId}`,
      })

      alert.acknowledge(userId)

      const saved = await repository.save(alert)

      expect(saved.id).toBe(alert.id)
      expect(saved.organizationId).toBe(orgId)
      expect(saved.type).toBe('cost_anomaly')
      expect(saved.severity).toBe('warning')
      expect(saved.status).toBe('acknowledged')
      expect(saved.title).toBe('Cost increased')
      expect(saved.description).toBe('Monthly cost increased by 50%')
      expect(saved.subscriptionId).toBe(subscriptionId)
      expect(saved.data).toEqual({
        previousCost: 10000,
        currentCost: 15000,
      })
      expect(saved.potentialSavings).toBe(5000n)
      expect(saved.currency).toBe('BRL')
      expect(saved.alertKey).toBe(`cost_anomaly:${subscriptionId}`)
      expect(saved.acknowledgedBy).toBe(userId)
      expect(saved.acknowledgedAt).toBeInstanceOf(Date)
    })
  })
})
