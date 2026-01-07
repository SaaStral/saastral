import { describe, it, expect } from 'vitest'
import { Department } from './department.entity'

describe('Department Entity', () => {
  describe('create', () => {
    it('should create department with auto-generated ID and timestamps', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.id).toBeDefined()
      expect(department.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i) // UUID v4
      expect(department.createdAt).toBeInstanceOf(Date)
      expect(department.updatedAt).toBeInstanceOf(Date)
    })

    it('should create with custom ID when provided', () => {
      const customId = 'dept-custom-123'

      const department = Department.create({
        id: customId,
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.id).toBe(customId)
    })

    it('should initialize with empty metadata', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.metadata).toEqual({})
    })

    it('should create root department without parent', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.parentId).toBeUndefined()
      expect(department.isRoot()).toBe(true)
    })

    it('should create child department with parent', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
        parentId: 'eng-dept-123',
      })

      expect(department.parentId).toBe('eng-dept-123')
      expect(department.isRoot()).toBe(false)
    })

    it('should create with all optional fields', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        description: 'Engineering team',
        parentId: 'root-dept',
        externalId: 'ext-123',
        externalProvider: 'google',
        path: '/Engineering',
        metadata: { customField: 'value' },
        createdBy: 'user-123',
        updatedBy: 'user-456',
      })

      expect(department.description).toBe('Engineering team')
      expect(department.parentId).toBe('root-dept')
      expect(department.externalId).toBe('ext-123')
      expect(department.externalProvider).toBe('google')
      expect(department.path).toBe('/Engineering')
      expect(department.metadata).toEqual({ customField: 'value' })
      expect(department.createdBy).toBe('user-123')
      expect(department.updatedBy).toBe('user-456')
    })
  })

  describe('reconstitute', () => {
    it('should reconstitute department from database props', () => {
      const props = {
        id: 'dept-123',
        organizationId: 'org-123',
        name: 'Engineering',
        metadata: {},
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      }

      const department = Department.reconstitute(props)

      expect(department.id).toBe('dept-123')
      expect(department.name).toBe('Engineering')
      expect(department.createdAt).toEqual(props.createdAt)
      expect(department.updatedAt).toEqual(props.updatedAt)
    })

    it('should reconstitute with hierarchical structure', () => {
      const department = Department.reconstitute({
        id: 'dept-123',
        organizationId: 'org-123',
        name: 'Backend',
        parentId: 'eng-dept',
        path: '/Engineering/Backend',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      expect(department.parentId).toBe('eng-dept')
      expect(department.path).toBe('/Engineering/Backend')
      expect(department.isRoot()).toBe(false)
    })
  })

  describe('updateName', () => {
    it('should update department name', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Old Name',
      })
      const beforeUpdate = new Date()

      department.updateName('New Name')

      expect(department.name).toBe('New Name')
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should trim whitespace from name', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Old Name',
      })

      department.updateName('  Trimmed Name  ')

      expect(department.name).toBe('Trimmed Name')
    })

    it('should throw when name is empty', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(() => department.updateName('')).toThrow('Department name cannot be empty')
    })

    it('should throw when name is only whitespace', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(() => department.updateName('   ')).toThrow('Department name cannot be empty')
    })
  })

  describe('updateDescription', () => {
    it('should update description', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })
      const beforeUpdate = new Date()

      department.updateDescription('New description')

      expect(department.description).toBe('New description')
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should clear description when undefined', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        description: 'Old description',
      })

      department.updateDescription(undefined)

      expect(department.description).toBeUndefined()
    })
  })

  describe('updateParent', () => {
    it('should update parent ID', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
      })
      const beforeUpdate = new Date()

      department.updateParent('eng-dept-123')

      expect(department.parentId).toBe('eng-dept-123')
      expect(department.isRoot()).toBe(false)
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should clear parent when undefined', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
        parentId: 'eng-dept-123',
      })

      department.updateParent(undefined)

      expect(department.parentId).toBeUndefined()
      expect(department.isRoot()).toBe(true)
    })

    it('should throw when setting self as parent', () => {
      const department = Department.create({
        id: 'dept-123',
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(() => department.updateParent('dept-123')).toThrow(
        'Department cannot be its own parent'
      )
    })
  })

  describe('updateExternalId', () => {
    it('should update external ID and provider', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })
      const beforeUpdate = new Date()

      department.updateExternalId('google-123', 'google')

      expect(department.externalId).toBe('google-123')
      expect(department.externalProvider).toBe('google')
      expect(department.hasExternalId()).toBe(true)
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should support all providers', () => {
      const providers = ['google', 'microsoft', 'okta', 'keycloak'] as const

      providers.forEach(provider => {
        const department = Department.create({
          organizationId: 'org-123',
          name: 'Engineering',
        })

        department.updateExternalId(`${provider}-123`, provider)

        expect(department.externalId).toBe(`${provider}-123`)
        expect(department.externalProvider).toBe(provider)
      })
    })

    it('should replace existing external ID', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        externalId: 'old-id',
        externalProvider: 'google',
      })

      department.updateExternalId('new-id', 'microsoft')

      expect(department.externalId).toBe('new-id')
      expect(department.externalProvider).toBe('microsoft')
    })
  })

  describe('updatePath', () => {
    it('should update path', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })
      const beforeUpdate = new Date()

      department.updatePath('/Engineering')

      expect(department.path).toBe('/Engineering')
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should support nested paths', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
      })

      department.updatePath('/Engineering/Backend')

      expect(department.path).toBe('/Engineering/Backend')
    })
  })

  describe('updateMetadata', () => {
    it('should update metadata', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        metadata: { existingKey: 'value' },
      })
      const beforeUpdate = new Date()

      department.updateMetadata({ newKey: 'newValue' })

      expect(department.metadata).toEqual({
        existingKey: 'value',
        newKey: 'newValue',
      })
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should merge with existing metadata', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        metadata: {
          key1: 'value1',
          key2: 'value2',
        },
      })

      department.updateMetadata({ key3: 'value3' })

      expect(department.metadata).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      })
    })

    it('should override existing keys', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        metadata: { key: 'old' },
      })

      department.updateMetadata({ key: 'new' })

      expect(department.metadata).toEqual({ key: 'new' })
    })
  })

  describe('clearExternalId', () => {
    it('should clear external ID and provider', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        externalId: 'ext-123',
        externalProvider: 'google',
      })
      const beforeClear = new Date()

      department.clearExternalId()

      expect(department.externalId).toBeUndefined()
      expect(department.externalProvider).toBeUndefined()
      expect(department.hasExternalId()).toBe(false)
      expect(department.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeClear.getTime())
    })

    it('should be safe to call when already cleared', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      department.clearExternalId()

      expect(department.externalId).toBeUndefined()
      expect(department.externalProvider).toBeUndefined()
    })
  })

  describe('isRoot', () => {
    it('should return true for department without parent', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.isRoot()).toBe(true)
    })

    it('should return false for department with parent', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
        parentId: 'eng-dept',
      })

      expect(department.isRoot()).toBe(false)
    })
  })

  describe('hasExternalId', () => {
    it('should return true when external ID exists', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        externalId: 'ext-123',
        externalProvider: 'google',
      })

      expect(department.hasExternalId()).toBe(true)
    })

    it('should return false when no external ID', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.hasExternalId()).toBe(false)
    })
  })

  describe('getDepth', () => {
    it('should return 0 for department without path', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
      })

      expect(department.getDepth()).toBe(0)
    })

    it('should return 1 for root level path', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        path: '/Engineering',
      })

      expect(department.getDepth()).toBe(1)
    })

    it('should return 2 for second level path', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Backend',
        path: '/Engineering/Backend',
      })

      expect(department.getDepth()).toBe(2)
    })

    it('should return 3 for third level path', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'API Team',
        path: '/Engineering/Backend/API Team',
      })

      expect(department.getDepth()).toBe(3)
    })

    it('should handle paths with trailing slashes', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        path: '/Engineering/',
      })

      expect(department.getDepth()).toBe(1)
    })

    it('should handle deeply nested paths', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Leaf Department',
        path: '/Level1/Level2/Level3/Level4/Level5',
      })

      expect(department.getDepth()).toBe(5)
    })
  })

  describe('hierarchical structure', () => {
    it('should support multi-level hierarchy', () => {
      // Create a 3-level hierarchy
      const root = Department.create({
        id: 'root',
        organizationId: 'org-123',
        name: 'Engineering',
        path: '/Engineering',
      })

      const level1 = Department.create({
        id: 'level1',
        organizationId: 'org-123',
        name: 'Backend',
        parentId: root.id,
        path: '/Engineering/Backend',
      })

      const level2 = Department.create({
        id: 'level2',
        organizationId: 'org-123',
        name: 'API Team',
        parentId: level1.id,
        path: '/Engineering/Backend/API Team',
      })

      expect(root.isRoot()).toBe(true)
      expect(root.getDepth()).toBe(1)

      expect(level1.isRoot()).toBe(false)
      expect(level1.parentId).toBe(root.id)
      expect(level1.getDepth()).toBe(2)

      expect(level2.isRoot()).toBe(false)
      expect(level2.parentId).toBe(level1.id)
      expect(level2.getDepth()).toBe(3)
    })

    it('should support moving department to different parent', () => {
      const oldParent = Department.create({
        id: 'old-parent',
        organizationId: 'org-123',
        name: 'Old Parent',
      })

      const newParent = Department.create({
        id: 'new-parent',
        organizationId: 'org-123',
        name: 'New Parent',
      })

      const child = Department.create({
        organizationId: 'org-123',
        name: 'Child',
        parentId: oldParent.id,
      })

      expect(child.parentId).toBe(oldParent.id)

      child.updateParent(newParent.id)

      expect(child.parentId).toBe(newParent.id)
    })

    it('should support promoting child to root', () => {
      const parent = Department.create({
        id: 'parent',
        organizationId: 'org-123',
        name: 'Parent',
      })

      const child = Department.create({
        organizationId: 'org-123',
        name: 'Child',
        parentId: parent.id,
      })

      expect(child.isRoot()).toBe(false)

      child.updateParent(undefined)

      expect(child.isRoot()).toBe(true)
      expect(child.parentId).toBeUndefined()
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON with all properties', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Engineering',
        description: 'Engineering team',
        parentId: 'root-dept',
        path: '/Engineering',
      })

      const json = department.toJSON()

      expect(json.id).toBe(department.id)
      expect(json.organizationId).toBe('org-123')
      expect(json.name).toBe('Engineering')
      expect(json.description).toBe('Engineering team')
      expect(json.parentId).toBe('root-dept')
      expect(json.path).toBe('/Engineering')
      expect(json.createdAt).toBeInstanceOf(Date)
      expect(json.updatedAt).toBeInstanceOf(Date)
    })

    it('should not mutate original when modifying JSON', () => {
      const department = Department.create({
        organizationId: 'org-123',
        name: 'Original Name',
      })

      const json = department.toJSON()
      json.name = 'Modified Name'

      expect(department.name).toBe('Original Name')
    })
  })
})
