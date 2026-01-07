/**
 * Prisma Implementation of DepartmentRepository
 *
 * Handles persistence of Department entities with hierarchical support.
 */

import type { PrismaClient } from '@saastral/database'
import { Department, type DepartmentRepository } from '@saastral/core'

export class PrismaDepartmentRepository implements DepartmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Department | null> {
    const record = await this.prisma.department.findUnique({
      where: { id },
    })

    return record ? this.toDomain(record) : null
  }

  async findByExternalId(
    organizationId: string,
    externalId: string,
    _provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<Department | null> {
    // Note: provider is not currently stored in the schema, but required by interface
    const record = await this.prisma.department.findFirst({
      where: {
        organizationId,
        externalId,
        deletedAt: null,
      },
    })

    return record ? this.toDomain(record) : null
  }

  async findByOrganization(organizationId: string): Promise<Department[]> {
    const records = await this.prisma.department.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findRootDepartments(organizationId: string): Promise<Department[]> {
    const records = await this.prisma.department.findMany({
      where: {
        organizationId,
        parentId: null,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findByParent(parentId: string): Promise<Department[]> {
    const records = await this.prisma.department.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return records.map((r) => this.toDomain(r))
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<Department | null> {
    const record = await this.prisma.department.findFirst({
      where: {
        organizationId,
        name,
        deletedAt: null,
      },
    })

    return record ? this.toDomain(record) : null
  }

  async save(department: Department): Promise<Department> {
    const data = this.toPersistence(department)

    const record = await this.prisma.department.upsert({
      where: { id: department.id },
      create: data,
      update: data,
    })

    return this.toDomain(record)
  }

  async saveMany(departments: Department[]): Promise<Department[]> {
    // Use transaction for batch operations
    const results = await this.prisma.$transaction(
      departments.map((dept) => {
        const data = this.toPersistence(dept)
        return this.prisma.department.upsert({
          where: { id: dept.id },
          create: data,
          update: data,
        })
      }),
    )

    return results.map((r) => this.toDomain(r))
  }

  async delete(id: string): Promise<void> {
    await this.prisma.department.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async existsByExternalId(
    organizationId: string,
    externalId: string,
    _provider: 'google' | 'microsoft' | 'okta' | 'keycloak',
  ): Promise<boolean> {
    // Note: provider is not currently stored in the schema, but required by interface
    const count = await this.prisma.department.count({
      where: {
        organizationId,
        externalId,
        deletedAt: null,
      },
    })

    return count > 0
  }

  async getHierarchy(departmentId: string): Promise<{
    department: Department
    ancestors: Department[]
    descendants: Department[]
  }> {
    // Get the department itself
    const deptRecord = await this.prisma.department.findUnique({
      where: { id: departmentId },
    })

    if (!deptRecord) {
      throw new Error(`Department with ID ${departmentId} not found`)
    }

    const department = this.toDomain(deptRecord)

    // Get ancestors (walk up the parent chain)
    const ancestors: Department[] = []
    let currentParentId = deptRecord.parentId

    while (currentParentId) {
      const parentRecord = await this.prisma.department.findUnique({
        where: { id: currentParentId },
      })

      if (!parentRecord) break

      ancestors.unshift(this.toDomain(parentRecord)) // Add to front
      currentParentId = parentRecord.parentId
    }

    // Get descendants (recursive query would be better, but use iterative approach)
    const descendants: Department[] = []
    const toProcess = [departmentId]

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!

      const children = await this.prisma.department.findMany({
        where: {
          parentId: currentId,
          deletedAt: null,
        },
      })

      for (const child of children) {
        descendants.push(this.toDomain(child))
        toProcess.push(child.id)
      }
    }

    return {
      department,
      ancestors,
      descendants,
    }
  }

  /**
   * Convert Prisma record to domain entity
   */
  private toDomain(record: any): Department {
    return Department.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      description: record.description || undefined,
      parentId: record.parentId || undefined,
      externalId: record.externalId || undefined,
      externalProvider: undefined, // Not stored in current schema
      path: undefined, // Not stored in current schema, can be computed
      metadata: (record.metadata as Record<string, unknown>) || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: undefined, // Not in schema
      updatedBy: undefined, // Not in schema
    })
  }

  /**
   * Convert domain entity to Prisma record
   */
  private toPersistence(department: Department): any {
    const props = department.toJSON()

    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      description: props.description || null,
      parentId: props.parentId || null,
      externalId: props.externalId || null,
      metadata: props.metadata || {},
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      deletedAt: null,
    }
  }
}
