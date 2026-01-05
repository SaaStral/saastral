/**
 * Department Service
 *
 * Handles department CRUD operations and hierarchy management.
 */

import { Department } from './department.entity'
import type { DepartmentRepository } from './department.repository'
import type { CreateDepartmentInput, UpdateDepartmentInput } from './department.types'

export interface DepartmentServiceDeps {
  departmentRepository: DepartmentRepository
}

export class DepartmentService {
  constructor(private readonly deps: DepartmentServiceDeps) {}

  /**
   * Create a new department
   *
   * @param input - Department creation input
   * @returns Created department
   */
  async create(input: CreateDepartmentInput): Promise<Department> {
    // Validate parent exists if provided
    if (input.parentId) {
      const parent = await this.deps.departmentRepository.findById(input.parentId)
      if (!parent) {
        throw new Error(`Parent department ${input.parentId} not found`)
      }
    }

    const department = Department.create(input)
    return await this.deps.departmentRepository.save(department)
  }

  /**
   * Get department by ID
   *
   * @param id - Department ID
   * @returns Department or null
   */
  async getById(id: string): Promise<Department | null> {
    return await this.deps.departmentRepository.findById(id)
  }

  /**
   * Get department by external ID
   *
   * @param organizationId - Organization ID
   * @param externalId - External ID from provider
   * @param provider - Provider name
   * @returns Department or null
   */
  async getByExternalId(
    organizationId: string,
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<Department | null> {
    return await this.deps.departmentRepository.findByExternalId(
      organizationId,
      externalId,
      provider,
    )
  }

  /**
   * Get department by name
   *
   * @param organizationId - Organization ID
   * @param name - Department name
   * @returns Department or null
   */
  async getByName(organizationId: string, name: string): Promise<Department | null> {
    return await this.deps.departmentRepository.findByName(organizationId, name)
  }

  /**
   * List all departments for organization
   *
   * @param organizationId - Organization ID
   * @returns Array of departments
   */
  async listByOrganization(organizationId: string): Promise<Department[]> {
    return await this.deps.departmentRepository.findByOrganization(organizationId)
  }

  /**
   * List root departments (no parent)
   *
   * @param organizationId - Organization ID
   * @returns Array of root departments
   */
  async listRoots(organizationId: string): Promise<Department[]> {
    return await this.deps.departmentRepository.findRootDepartments(organizationId)
  }

  /**
   * List child departments
   *
   * @param parentId - Parent department ID
   * @returns Array of child departments
   */
  async listChildren(parentId: string): Promise<Department[]> {
    return await this.deps.departmentRepository.findByParent(parentId)
  }

  /**
   * Get department hierarchy
   *
   * Returns the department, its ancestors (parent chain), and descendants (all children).
   *
   * @param departmentId - Department ID
   * @returns Hierarchy object
   */
  async getHierarchy(departmentId: string): Promise<{
    department: Department
    ancestors: Department[]
    descendants: Department[]
  }> {
    return await this.deps.departmentRepository.getHierarchy(departmentId)
  }

  /**
   * Update department
   *
   * @param id - Department ID
   * @param input - Update input
   * @returns Updated department
   */
  async update(id: string, input: UpdateDepartmentInput): Promise<Department> {
    const department = await this.deps.departmentRepository.findById(id)

    if (!department) {
      throw new Error(`Department ${id} not found`)
    }

    // Update name
    if (input.name !== undefined) {
      department.updateName(input.name)
    }

    // Update description
    if (input.description !== undefined) {
      department.updateDescription(input.description)
    }

    // Update parent
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        // Remove parent (make root)
        department.updateParent(undefined)
      } else {
        // Validate new parent exists
        const parent = await this.deps.departmentRepository.findById(input.parentId)
        if (!parent) {
          throw new Error(`Parent department ${input.parentId} not found`)
        }

        // Prevent circular references
        if (input.parentId === id) {
          throw new Error('Department cannot be its own parent')
        }

        // Check if new parent is a descendant (would create a cycle)
        const { descendants } = await this.deps.departmentRepository.getHierarchy(id)
        const isDescendant = descendants.some((d) => d.id === input.parentId)
        if (isDescendant) {
          throw new Error('Cannot set a descendant as parent (would create a cycle)')
        }

        department.updateParent(input.parentId)
      }
    }

    return await this.deps.departmentRepository.save(department)
  }

  /**
   * Delete department
   *
   * Soft deletes the department. Children are not automatically deleted.
   *
   * @param id - Department ID
   */
  async delete(id: string): Promise<void> {
    const department = await this.deps.departmentRepository.findById(id)

    if (!department) {
      throw new Error(`Department ${id} not found`)
    }

    // Check for children
    const children = await this.deps.departmentRepository.findByParent(id)
    if (children.length > 0) {
      throw new Error(
        `Cannot delete department with ${children.length} child department(s). Delete children first or reassign them.`,
      )
    }

    await this.deps.departmentRepository.delete(id)
  }

  /**
   * Check if department exists by external ID
   *
   * @param organizationId - Organization ID
   * @param externalId - External ID
   * @param provider - Provider name
   * @returns True if exists
   */
  async existsByExternalId(
    organizationId: string,
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<boolean> {
    return await this.deps.departmentRepository.existsByExternalId(
      organizationId,
      externalId,
      provider,
    )
  }

  /**
   * Batch create departments
   *
   * @param departments - Array of departments to create
   * @returns Array of created departments
   */
  async createMany(departments: Department[]): Promise<Department[]> {
    return await this.deps.departmentRepository.saveMany(departments)
  }
}
