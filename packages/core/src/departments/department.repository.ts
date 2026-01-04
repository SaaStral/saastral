/**
 * Department Repository Interface (Port)
 *
 * Defines the contract for persistence operations on Department entities.
 * This is a port in the hexagonal architecture - implementations live in
 * the infrastructure layer.
 */

import type { Department } from './department.entity'

/**
 * Repository interface for Department persistence
 */
export interface DepartmentRepository {
  /**
   * Find department by ID
   */
  findById(id: string): Promise<Department | null>

  /**
   * Find department by external ID (from directory provider)
   */
  findByExternalId(
    organizationId: string,
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<Department | null>

  /**
   * Find all departments for an organization
   */
  findByOrganization(organizationId: string): Promise<Department[]>

  /**
   * Find all root departments (no parent) for an organization
   */
  findRootDepartments(organizationId: string): Promise<Department[]>

  /**
   * Find child departments of a parent
   */
  findByParent(parentId: string): Promise<Department[]>

  /**
   * Find department by name within an organization
   */
  findByName(
    organizationId: string,
    name: string,
  ): Promise<Department | null>

  /**
   * Save (create or update) a department
   */
  save(department: Department): Promise<Department>

  /**
   * Save multiple departments (for batch sync)
   */
  saveMany(departments: Department[]): Promise<Department[]>

  /**
   * Delete a department
   */
  delete(id: string): Promise<void>

  /**
   * Check if department exists by external ID
   */
  existsByExternalId(
    organizationId: string,
    externalId: string,
    provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<boolean>

  /**
   * Get department hierarchy (department with all ancestors and descendants)
   */
  getHierarchy(departmentId: string): Promise<{
    department: Department
    ancestors: Department[]
    descendants: Department[]
  }>
}
