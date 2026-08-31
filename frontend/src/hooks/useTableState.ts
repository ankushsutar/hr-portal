import { useState, useEffect, useCallback } from 'react'

export interface TableStateOptions {
  initialPage?: number
  initialLimit?: number
  initialSearch?: string
  initialSortBy?: string
  initialSortOrder?: 'ASC' | 'DESC'
  initialFilters?: Record<string, string>
  debounceMs?: number
}

export function useTableState(options: TableStateOptions = {}) {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSearch = '',
    initialSortBy = '',
    initialSortOrder = 'DESC',
    initialFilters = {},
    debounceMs = 300,
  } = options

  const [page, setPage] = useState<number>(initialPage)
  const [limit, setLimit] = useState<number>(initialLimit)
  const [search, setSearch] = useState<string>(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch)
  const [sortBy, setSortBy] = useState<string>(initialSortBy)
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(initialSortOrder)
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters)

  // Handle debounced search update
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset to page 1 on new search term
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [search, debounceMs])

  const setFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => {
      const next = { ...prev }
      if (value === '' || value === undefined) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
    setPage(1) // Reset to page 1 on filter change
  }, [])

  const clearAllFilters = useCallback(() => {
    setSearch('')
    setDebouncedSearch('')
    setFilters({})
    setPage(1)
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const toggleSort = useCallback(
    (field: string) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
      } else {
        setSortBy(field)
        setSortOrder('ASC')
      }
      setPage(1)
    },
    [sortBy]
  )

  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', limit.toString())
  if (debouncedSearch) queryParams.set('search', debouncedSearch)
  if (sortBy) queryParams.set('sort_by', sortBy)
  if (sortOrder) queryParams.set('sort_order', sortOrder)
  Object.entries(filters).forEach(([k, v]) => {
    if (v) queryParams.set(k, v)
  })

  return {
    page,
    setPage,
    limit,
    setLimit: handleLimitChange,
    search,
    setSearch,
    debouncedSearch,
    sortBy,
    sortOrder,
    toggleSort,
    filters,
    setFilter,
    clearAllFilters,
    hasActiveFilters: Boolean(search || Object.keys(filters).length > 0),
    queryParams,
  }
}
