import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

interface PaginationBarProps {
  meta?: PaginationMeta
  page: number
  limit: number
  total: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  limitOptions?: number[]
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  meta,
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50, 100],
}) => {
  const totalPages = meta?.total_pages ?? Math.max(1, Math.ceil(total / (limit || 10)))
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1
  const endItem = Math.min(page * limit, total)

  // Generate dynamic page numbers range
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i)
      }

      if (page < totalPages - 2) pages.push('...')
      if (!pages.includes(totalPages)) pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-[var(--bg-page)] border-t border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)]">
      {/* Items count & Per Page Selector */}
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="text-[var(--text-main)] font-bold">{startItem}</span> to{' '}
          <span className="text-[var(--text-main)] font-bold">{endItem}</span> of{' '}
          <span className="text-[var(--text-main)] font-bold">{total}</span> items
        </span>

        <div className="flex items-center gap-1.5 border-l border-[var(--border-color)] pl-4">
          <span className="text-[var(--text-muted)]">Per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded px-2 py-1 text-[var(--text-main)] focus:outline-none focus:border-[var(--color-primary)] text-xs"
          >
            {limitOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          title="First Page"
          className="p-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 text-[var(--text-main)] transition-colors"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous Page"
          className="p-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 text-[var(--text-main)] transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1 px-1">
          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded font-semibold transition-colors ${
                  page === p
                    ? 'theme-accent-bg text-white border border-[var(--color-primary)]'
                    : 'bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-[var(--text-muted)]">
                {p}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next Page"
          className="p-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 text-[var(--text-main)] transition-colors"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Last Page"
          className="p-1.5 rounded border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] disabled:opacity-40 text-[var(--text-main)] transition-colors"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
