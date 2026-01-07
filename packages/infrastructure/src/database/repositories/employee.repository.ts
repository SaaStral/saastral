import type { PrismaClient } from '@saastral/database'
import {
  Employee,
  EmployeeRepository,
  EmployeeFilters,
  EmployeeListItem,
  OffboardingAlert,
  DepartmentBreakdown,
} from '@saastral/core'
import { Email } from '@saastral/core'

/**
 * Prisma implementation of EmployeeRepository
 */
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, organizationId: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findFirst({
      where: { id, organizationId, deletedAt: null },
    })
    return record ? this.toDomain(record) : null
  }

  async findByEmail(email: string, organizationId: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findFirst({
      where: { email: email.toLowerCase(), organizationId, deletedAt: null },
    })
    return record ? this.toDomain(record) : null
  }

  async findByExternalId(externalId: string, organizationId: string): Promise<Employee | null> {
    const record = await this.prisma.employee.findFirst({
      where: { externalId, organizationId, deletedAt: null },
    })
    return record ? this.toDomain(record) : null
  }

  async list(
    organizationId: string,
    filters: EmployeeFilters,
    pagination: { page: number; pageSize: number }
  ): Promise<{ employees: EmployeeListItem[]; totalCount: number }> {
    const where: any = { organizationId, deletedAt: null }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ]
    }
    if (filters.departmentId) {
      where.departmentId = filters.departmentId
    }
    if (filters.hasActiveSubscriptions !== undefined && filters.hasActiveSubscriptions) {
      where.subscriptionUsers = { some: { status: 'active' } }
    }

    const totalCount = await this.prisma.employee.count({ where })

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true, name: true, email: true, status: true, avatarUrl: true, monthlySaasCost: true,
        department: { select: { name: true } },
        subscriptionUsers: {
          where: { status: 'active' },
          select: {
            id: true, lastUsedAt: true,
            subscription: { select: { name: true, logoUrl: true } },
          },
        },
        loginEvents: {
          orderBy: { eventAt: 'desc' },
          take: 1,
          select: { eventAt: true, appName: true },
        },
      },
      orderBy: { name: 'asc' },
      skip: (pagination.page - 1) * pagination.pageSize,
      take: pagination.pageSize,
    })

    const employeeListItems: EmployeeListItem[] = employees.map(emp => {
      const lastActivity = emp.loginEvents[0]
      const lastActivityDate = lastActivity?.eventAt || null
      const daysSinceActivity = lastActivityDate
        ? Math.floor((new Date().getTime() - lastActivityDate.getTime()) / 86400000)
        : null

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: this.getDepartmentCategory(emp.department?.name || null),
        status: emp.status as any,
        licenseCount: emp.subscriptionUsers.length,
        licenses: emp.subscriptionUsers.slice(0, 5).map(su => ({
          name: su.subscription.name,
          icon: su.subscription.name.charAt(0).toUpperCase(),
          color: this.getAvatarColor(su.subscription.name),
        })),
        monthlyCost: Number(emp.monthlySaasCost || 0),
        lastActivityTime: this.getRelativeTime(lastActivityDate),
        activitySource: lastActivity ? `via ${lastActivity.appName}` : 'via Okta',
        avatar: {
          initials: this.getInitials(emp.name),
          color: this.getAvatarColor(emp.id),
        },
        hasWarning: daysSinceActivity !== null && daysSinceActivity > 30,
      }
    })

    return { employees: employeeListItems, totalCount }
  }

  async countByStatus(organizationId: string, status?: 'active' | 'suspended' | 'offboarded'): Promise<number> {
    return await this.prisma.employee.count({
      where: { organizationId, status: status || undefined, deletedAt: null },
    })
  }

  async countOffboardedWithActiveSubscriptions(organizationId: string): Promise<number> {
    return await this.prisma.employee.count({
      where: {
        organizationId,
        status: 'offboarded',
        deletedAt: null,
        subscriptionUsers: { some: { status: 'active' } },
      },
    })
  }

  async getOffboardingAlerts(organizationId: string, limit = 10): Promise<OffboardingAlert[]> {
    const offboardedEmployees = await this.prisma.employee.findMany({
      where: {
        organizationId,
        status: 'offboarded',
        deletedAt: null,
        subscriptionUsers: { some: { status: 'active' } },
      },
      select: {
        id: true, name: true, email: true, offboardedAt: true,
        subscriptionUsers: {
          where: { status: 'active' },
          select: {
            subscription: { select: { name: true, logoUrl: true, pricePerUnit: true } },
          },
        },
      },
      orderBy: { offboardedAt: 'desc' },
      take: limit,
    })

    return offboardedEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      email: emp.email,
      offboardingDate: emp.offboardedAt?.toLocaleDateString('pt-BR') || '',
      timeAgo: this.getRelativeTime(emp.offboardedAt),
      licenses: emp.subscriptionUsers.map(su => ({
        name: su.subscription.name,
        icon: su.subscription.name.charAt(0).toUpperCase(),
        color: this.getAvatarColor(su.subscription.name),
      })),
      totalCost: emp.subscriptionUsers.reduce((sum, su) => sum + Number(su.subscription.pricePerUnit || 0), 0),
    }))
  }

  async getDepartmentBreakdown(organizationId: string): Promise<DepartmentBreakdown[]> {
    const departments = await this.prisma.department.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true, name: true,
        employees: {
          where: { status: 'active', deletedAt: null },
          select: { monthlySaasCost: true },
        },
      },
    })

    const totalCost = departments.reduce((sum, dept) =>
      sum + dept.employees.reduce((s, e) => s + Number(e.monthlySaasCost || 0), 0), 0)

    const colors: Record<string, string> = {
      engineering: '#3b82f6', product: '#8b5cf6', marketing: '#ec4899',
      sales: '#f97316', design: '#14b8a6', admin: '#6b7280',
    }

    return departments
      .map(dept => {
        const monthlyCost = dept.employees.reduce((s, e) => s + Number(e.monthlySaasCost || 0), 0)
        const percentage = totalCost > 0 ? (monthlyCost / totalCost) * 100 : 0
        return {
          name: dept.name,
          employeeCount: dept.employees.length,
          monthlyCost,
          percentage: Math.round(percentage * 10) / 10,
          color: colors[this.getDepartmentCategory(dept.name)] || '#6b7280',
        }
      })
      .filter(d => d.employeeCount > 0)
      .sort((a, b) => b.monthlyCost - a.monthlyCost)
  }

  async calculateLicenseUtilization(organizationId: string): Promise<number> {
    const subs = await this.prisma.subscription.findMany({
      where: { organizationId, status: 'active', deletedAt: null },
      select: { totalSeats: true, usedSeats: true },
    })
    const totalSeats = subs.reduce((s, sub) => s + (sub.totalSeats || 0), 0)
    const usedSeats = subs.reduce((s, sub) => s + (sub.usedSeats || 0), 0)
    return totalSeats > 0 ? Math.round((usedSeats / totalSeats) * 100) : 0
  }

  async getAverageMonthlyCost(organizationId: string): Promise<number> {
    const result = await this.prisma.employee.aggregate({
      where: { organizationId, status: 'active', deletedAt: null },
      _avg: { monthlySaasCost: true },
      _count: true,
    })
    return result._count > 0 ? Number(result._avg.monthlySaasCost || 0) : 0
  }

  async save(employee: Employee): Promise<Employee> {
    const data = this.toPersistence(employee)
    const record = await this.prisma.employee.upsert({
      where: { id: employee.id },
      create: data,
      update: data,
    })
    return this.toDomain(record)
  }

  async delete(id: string, organizationId: string): Promise<void> {
    await this.prisma.employee.update({
      where: { id, organizationId },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    })
  }

  async bulkUpdateMonthlyCosts(updates: Array<{ employeeId: string; costInCents: bigint }>): Promise<void> {
    await this.prisma.$transaction(
      updates.map(u =>
        this.prisma.employee.update({
          where: { id: u.employeeId },
          data: { monthlySaasCost: u.costInCents, updatedAt: new Date() },
        })
      )
    )
  }

  private toDomain(record: any): Employee {
    return Employee.reconstitute({
      id: record.id,
      organizationId: record.organizationId,
      name: record.name,
      email: Email.reconstitute(record.email),
      title: record.title || undefined,
      phone: record.phone || undefined,
      avatarUrl: record.avatarUrl || undefined,
      status: record.status,
      departmentId: record.departmentId || undefined,
      managerId: record.managerId || undefined,
      hiredAt: record.hiredAt || undefined,
      offboardedAt: record.offboardedAt || undefined,
      externalId: record.externalId || undefined,
      externalProvider: record.externalProvider || undefined,
      metadata: (record.metadata as Record<string, unknown>) || {},
      monthlySaasCost: record.monthlySaasCost || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      createdBy: record.createdBy || undefined,
      updatedBy: record.updatedBy || undefined,
    })
  }

  private toPersistence(employee: Employee): any {
    const props = employee.toJSON()
    return {
      id: props.id,
      organizationId: props.organizationId,
      name: props.name,
      email: props.email.toString(),
      title: props.title || null,
      phone: props.phone || null,
      avatarUrl: props.avatarUrl || null,
      status: props.status,
      departmentId: props.departmentId || null,
      managerId: props.managerId || null,
      hiredAt: props.hiredAt || null,
      offboardedAt: props.offboardedAt || null,
      externalId: props.externalId || null,
      externalProvider: props.externalProvider || null,
      metadata: props.metadata,
      monthlySaasCost: props.monthlySaasCost || null,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      createdBy: props.createdBy || null,
      updatedBy: props.updatedBy || null,
    }
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(p => p.length > 0)
    if (parts.length === 0) return '??'
    if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase()
    return ((parts[0]?.[0] || '?') + (parts[parts.length - 1]?.[0] || '?')).toUpperCase()
  }

  private getAvatarColor(id: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6b7280', '#10b981', '#f59e0b']
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]!
  }

  private getDepartmentCategory(departmentName: string | null): string {
    if (!departmentName) return 'admin'
    const name = departmentName.toLowerCase()
    if (name.includes('eng') || name.includes('dev') || name.includes('tech')) return 'engineering'
    if (name.includes('product') || name.includes('pm')) return 'product'
    if (name.includes('market')) return 'marketing'
    if (name.includes('sales') || name.includes('revenue')) return 'sales'
    if (name.includes('design') || name.includes('ux') || name.includes('ui')) return 'design'
    return 'admin'
  }

  private getRelativeTime(date: Date | null): string {
    if (!date) return 'Nunca'
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`
    return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`
  }
}
