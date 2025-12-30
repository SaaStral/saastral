/**
 * Common types shared across the application
 */

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type Maybe<T> = T | null | undefined

export type ID = string

export type Timestamp = Date

export type PaginationParams = {
  page: number
  limit: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type SortOrder = 'asc' | 'desc'

export type SortParams<T extends string = string> = {
  field: T
  order: SortOrder
}
