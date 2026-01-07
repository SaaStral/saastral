import { describe, it, expect } from 'vitest'
import { Alert, AlertType, AlertSeverity, AlertStatus } from './alert.entity'

describe('Alert Entity', () => {
  describe('create', () => {
    it('should create alert with auto-generated ID and timestamps', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Employee offboarded with active licenses',
      })

      expect(alert.id).toBeDefined()
      expect(alert.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) // UUID v4
      expect(alert.createdAt).toBeInstanceOf(Date)
      expect(alert.updatedAt).toBeInstanceOf(Date)
    })

    it('should create with custom ID when provided', () => {
      const customId = 'custom-alert-123'

      const alert = Alert.create({
        id: customId,
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      expect(alert.id).toBe(customId)
    })

    it('should default to pending status', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      expect(alert.status).toBe('pending')
      expect(alert.isPending()).toBe(true)
    })

    it('should create offboarding alert with employee reference', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Employee offboarded',
        employeeId: 'emp-123',
        potentialSavings: 5000n,
        currency: 'BRL',
      })

      expect(alert.type).toBe('offboarding')
      expect(alert.employeeId).toBe('emp-123')
      expect(alert.potentialSavings).toBe(5000n)
      expect(alert.currency).toBe('BRL')
    })

    it('should create renewal alert with subscription reference', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'renewal_upcoming',
        severity: 'warning',
        title: 'Subscription renewal in 30 days',
        subscriptionId: 'sub-123',
      })

      expect(alert.type).toBe('renewal_upcoming')
      expect(alert.subscriptionId).toBe('sub-123')
    })

    it('should create unused license alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'unused_license',
        severity: 'warning',
        title: 'License unused for 30+ days',
        employeeId: 'emp-123',
        subscriptionId: 'sub-123',
        potentialSavings: 2000n,
      })

      expect(alert.type).toBe('unused_license')
      expect(alert.employeeId).toBe('emp-123')
      expect(alert.subscriptionId).toBe('sub-123')
    })

    it('should create with optional fields', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'cost_anomaly',
        severity: 'critical',
        title: 'Unusual cost increase detected',
        description: 'Monthly cost increased by 200%',
        subscriptionId: 'sub-123',
        data: { previousCost: 1000, currentCost: 3000 },
        alertKey: 'cost_anomaly:sub-123',
      })

      expect(alert.description).toBe('Monthly cost increased by 200%')
      expect(alert.data).toEqual({ previousCost: 1000, currentCost: 3000 })
      expect(alert.alertKey).toBe('cost_anomaly:sub-123')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute alert from database props', () => {
      const props = {
        id: 'alert-123',
        organizationId: 'org-123',
        type: 'offboarding' as AlertType,
        severity: 'critical' as AlertSeverity,
        status: 'pending' as AlertStatus,
        title: 'Test alert',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      const alert = Alert.reconstitute(props)

      expect(alert.id).toBe('alert-123')
      expect(alert.type).toBe('offboarding')
      expect(alert.status).toBe('pending')
      expect(alert.createdAt).toEqual(props.createdAt)
    })

    it('should reconstitute resolved alert with all fields', () => {
      const alert = Alert.reconstitute({
        id: 'alert-123',
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        status: 'resolved',
        title: 'Test alert',
        resolvedAt: new Date('2024-01-05'),
        resolvedBy: 'user-123',
        resolutionNotes: 'Licenses removed',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-05'),
      })

      expect(alert.isResolved()).toBe(true)
      expect(alert.resolvedAt).toBeInstanceOf(Date)
      expect(alert.resolvedBy).toBe('user-123')
      expect(alert.resolutionNotes).toBe('Licenses removed')
    })
  })

  describe('generateAlertKey', () => {
    it('should generate offboarding alert key', () => {
      const key = Alert.generateAlertKey('offboarding', { employeeId: 'emp-123' })

      expect(key).toBe('offboarding:emp-123')
    })

    it('should throw when offboarding key missing employeeId', () => {
      expect(() => Alert.generateAlertKey('offboarding', {})).toThrow(
        'employeeId required for offboarding alert key'
      )
    })

    it('should generate renewal alert key', () => {
      const key = Alert.generateAlertKey('renewal_upcoming', { subscriptionId: 'sub-123' })

      expect(key).toBe('renewal:sub-123')
    })

    it('should throw when renewal key missing subscriptionId', () => {
      expect(() => Alert.generateAlertKey('renewal_upcoming', {})).toThrow(
        'subscriptionId required for renewal_upcoming alert key'
      )
    })

    it('should generate unused license alert key', () => {
      const key = Alert.generateAlertKey('unused_license', {
        employeeId: 'emp-123',
        subscriptionId: 'sub-456',
      })

      expect(key).toBe('unused:emp-123:sub-456')
    })

    it('should throw when unused license key missing fields', () => {
      expect(() =>
        Alert.generateAlertKey('unused_license', { employeeId: 'emp-123' })
      ).toThrow('employeeId and subscriptionId required for unused_license alert key')
    })

    it('should generate low utilization alert key', () => {
      const key = Alert.generateAlertKey('low_utilization', { subscriptionId: 'sub-123' })

      expect(key).toBe('low_util:sub-123')
    })

    it('should generate duplicate tool alert key', () => {
      const key = Alert.generateAlertKey('duplicate_tool', {
        metadata: { category: 'project-management' },
      })

      expect(key).toBe('duplicate:project-management')
    })

    it('should throw when duplicate tool key missing category', () => {
      expect(() => Alert.generateAlertKey('duplicate_tool', {})).toThrow(
        'category metadata required for duplicate_tool alert key'
      )
    })

    it('should generate cost anomaly alert key', () => {
      const key = Alert.generateAlertKey('cost_anomaly', { subscriptionId: 'sub-123' })

      expect(key).toBe('cost_anomaly:sub-123')
    })

    it('should generate seat shortage alert key', () => {
      const key = Alert.generateAlertKey('seat_shortage', { subscriptionId: 'sub-123' })

      expect(key).toBe('seat_shortage:sub-123')
    })

    it('should generate trial ending alert key', () => {
      const key = Alert.generateAlertKey('trial_ending', { subscriptionId: 'sub-123' })

      expect(key).toBe('trial_ending:sub-123')
    })
  })

  describe('acknowledge', () => {
    it('should acknowledge pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeAck = new Date()

      alert.acknowledge('user-123')

      expect(alert.status).toBe('acknowledged')
      expect(alert.isAcknowledged()).toBe(true)
      expect(alert.acknowledgedBy).toBe('user-123')
      expect(alert.acknowledgedAt).toBeInstanceOf(Date)
      expect(alert.acknowledgedAt!.getTime()).toBeGreaterThanOrEqual(beforeAck.getTime())
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeAck = new Date()

      alert.acknowledge('user-123')

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeAck.getTime())
    })

    it('should throw when acknowledging non-pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.resolve('user-123')

      expect(() => alert.acknowledge('user-456')).toThrow(
        'Cannot acknowledge alert with status: resolved'
      )
    })
  })

  describe('resolve', () => {
    it('should resolve pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeResolve = new Date()

      alert.resolve('user-123', 'Licenses removed')

      expect(alert.status).toBe('resolved')
      expect(alert.isResolved()).toBe(true)
      expect(alert.resolvedBy).toBe('user-123')
      expect(alert.resolutionNotes).toBe('Licenses removed')
      expect(alert.resolvedAt).toBeInstanceOf(Date)
      expect(alert.resolvedAt!.getTime()).toBeGreaterThanOrEqual(beforeResolve.getTime())
    })

    it('should resolve acknowledged alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.acknowledge('user-123')

      alert.resolve('user-456', 'Fixed')

      expect(alert.isResolved()).toBe(true)
      expect(alert.resolvedBy).toBe('user-456')
    })

    it('should resolve without notes', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.resolve('user-123')

      expect(alert.isResolved()).toBe(true)
      expect(alert.resolutionNotes).toBeUndefined()
    })

    it('should be idempotent when already resolved', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.resolve('user-123', 'First resolution')

      const firstResolvedAt = alert.resolvedAt

      alert.resolve('user-456', 'Second resolution')

      expect(alert.resolvedAt).toBe(firstResolvedAt)
      expect(alert.resolvedBy).toBe('user-123')
      expect(alert.resolutionNotes).toBe('First resolution')
    })

    it('should throw when resolving dismissed alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.dismiss('user-123', 'Not relevant')

      expect(() => alert.resolve('user-456')).toThrow('Cannot resolve dismissed alert')
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeResolve = new Date()

      alert.resolve('user-123')

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeResolve.getTime())
    })
  })

  describe('dismiss', () => {
    it('should dismiss pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeDismiss = new Date()

      alert.dismiss('user-123', 'False positive')

      expect(alert.status).toBe('dismissed')
      expect(alert.isDismissed()).toBe(true)
      expect(alert.dismissedBy).toBe('user-123')
      expect(alert.dismissReason).toBe('False positive')
      expect(alert.dismissedAt).toBeInstanceOf(Date)
      expect(alert.dismissedAt!.getTime()).toBeGreaterThanOrEqual(beforeDismiss.getTime())
    })

    it('should dismiss acknowledged alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.acknowledge('user-123')

      alert.dismiss('user-456', 'No action needed')

      expect(alert.isDismissed()).toBe(true)
      expect(alert.dismissedBy).toBe('user-456')
    })

    it('should dismiss without reason', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.dismiss('user-123')

      expect(alert.isDismissed()).toBe(true)
      expect(alert.dismissReason).toBeUndefined()
    })

    it('should throw when dismissing resolved alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.resolve('user-123')

      expect(() => alert.dismiss('user-456')).toThrow('Cannot dismiss resolved alert')
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeDismiss = new Date()

      alert.dismiss('user-123')

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeDismiss.getTime())
    })
  })

  describe('snooze', () => {
    it('should snooze pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow

      alert.snooze('user-123', snoozeUntil)

      expect(alert.snoozedUntil).toEqual(snoozeUntil)
      expect(alert.snoozedBy).toBe('user-123')
      expect(alert.isSnoozed()).toBe(true)
    })

    it('should throw when snoozing non-pending alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      alert.acknowledge('user-123')
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

      expect(() => alert.snooze('user-456', futureDate)).toThrow(
        'Can only snooze pending alerts'
      )
    })

    it('should throw when snooze date is in the past', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday

      expect(() => alert.snooze('user-123', pastDate)).toThrow(
        'Snooze date must be in the future'
      )
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeSnooze = new Date()
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)

      alert.snooze('user-123', futureDate)

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeSnooze.getTime())
    })
  })

  describe('unsnooze', () => {
    it('should remove snooze from snoozed alert', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      alert.snooze('user-123', futureDate)

      alert.unsnooze()

      expect(alert.snoozedUntil).toBeUndefined()
      expect(alert.snoozedBy).toBeUndefined()
      expect(alert.isSnoozed()).toBe(false)
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      alert.snooze('user-123', futureDate)
      const beforeUnsnooze = new Date()

      alert.unsnooze()

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUnsnooze.getTime())
    })
  })

  describe('updateSeverity', () => {
    it('should update severity', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'warning',
        title: 'Test alert',
      })

      alert.updateSeverity('critical')

      expect(alert.severity).toBe('critical')
      expect(alert.isCritical()).toBe(true)
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'warning',
        title: 'Test alert',
      })
      const beforeUpdate = new Date()

      alert.updateSeverity('critical')

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('updatePotentialSavings', () => {
    it('should update potential savings', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.updatePotentialSavings(5000n, 'BRL')

      expect(alert.potentialSavings).toBe(5000n)
      expect(alert.currency).toBe('BRL')
    })

    it('should default to BRL currency', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.updatePotentialSavings(3000n)

      expect(alert.currency).toBe('BRL')
    })

    it('should support different currencies', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.updatePotentialSavings(10000n, 'USD')

      expect(alert.currency).toBe('USD')
    })

    it('should update updatedAt timestamp', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })
      const beforeUpdate = new Date()

      alert.updatePotentialSavings(5000n)

      expect(alert.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })
  })

  describe('computed properties', () => {
    describe('isPending', () => {
      it('should return true for pending alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isPending()).toBe(true)
      })

      it('should return false for acknowledged alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })
        alert.acknowledge('user-123')

        expect(alert.isPending()).toBe(false)
      })
    })

    describe('isAcknowledged', () => {
      it('should return true for acknowledged alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })
        alert.acknowledge('user-123')

        expect(alert.isAcknowledged()).toBe(true)
      })

      it('should return false for pending alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isAcknowledged()).toBe(false)
      })
    })

    describe('isResolved', () => {
      it('should return true for resolved alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })
        alert.resolve('user-123')

        expect(alert.isResolved()).toBe(true)
      })

      it('should return false for pending alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isResolved()).toBe(false)
      })
    })

    describe('isDismissed', () => {
      it('should return true for dismissed alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })
        alert.dismiss('user-123')

        expect(alert.isDismissed()).toBe(true)
      })

      it('should return false for pending alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isDismissed()).toBe(false)
      })
    })

    describe('isCritical', () => {
      it('should return true for critical alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isCritical()).toBe(true)
      })

      it('should return false for warning alert', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'warning',
          title: 'Test alert',
        })

        expect(alert.isCritical()).toBe(false)
      })
    })

    describe('isSnoozed', () => {
      it('should return true when snoozed until future date', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
        alert.snooze('user-123', futureDate)

        expect(alert.isSnoozed()).toBe(true)
      })

      it('should return false when snooze date has passed', () => {
        const alert = Alert.reconstitute({
          id: 'alert-123',
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          status: 'pending',
          title: 'Test alert',
          snoozedUntil: new Date(Date.now() - 1000), // Past date
          snoozedBy: 'user-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        expect(alert.isSnoozed()).toBe(false)
      })

      it('should return false when not snoozed', () => {
        const alert = Alert.create({
          organizationId: 'org-123',
          type: 'offboarding',
          severity: 'critical',
          title: 'Test alert',
        })

        expect(alert.isSnoozed()).toBe(false)
      })
    })
  })

  describe('status lifecycle', () => {
    it('should support pending → acknowledged → resolved flow', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      expect(alert.isPending()).toBe(true)

      alert.acknowledge('user-123')
      expect(alert.isAcknowledged()).toBe(true)

      alert.resolve('user-456')
      expect(alert.isResolved()).toBe(true)
    })

    it('should support pending → resolved flow (skip acknowledge)', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.resolve('user-123')

      expect(alert.isResolved()).toBe(true)
    })

    it('should support pending → dismissed flow', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.dismiss('user-123')

      expect(alert.isDismissed()).toBe(true)
    })

    it('should support pending → acknowledged → dismissed flow', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
      })

      alert.acknowledge('user-123')
      alert.dismiss('user-456')

      expect(alert.isDismissed()).toBe(true)
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Test alert',
        employeeId: 'emp-123',
        potentialSavings: 5000n,
      })

      const json = alert.toJSON()

      expect(json.id).toBe(alert.id)
      expect(json.organizationId).toBe('org-123')
      expect(json.type).toBe('offboarding')
      expect(json.severity).toBe('critical')
      expect(json.status).toBe('pending')
      expect(json.employeeId).toBe('emp-123')
      expect(json.potentialSavings).toBe(5000n)
    })

    it('should not mutate original when modifying JSON', () => {
      const alert = Alert.create({
        organizationId: 'org-123',
        type: 'offboarding',
        severity: 'critical',
        title: 'Original title',
      })

      const json = alert.toJSON()
      json.title = 'Modified title'

      expect(alert.title).toBe('Original title')
    })
  })
})
