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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-[#0B0F19] border-t border-slate-800 text-xs font-mono text-slate-400">
      {/* Items count & Per Page Selector */}
      <div className="flex items-center gap-4">
        <span>
          Showing <span className="text-slate-200 font-bold">{startItem}</span> to{' '}
          <span className="text-slate-200 font-bold">{endItem}</span> of{' '}
          <span className="text-slate-200 font-bold">{total}</span> items
        </span>

        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-4">
          <span className="text-slate-500">Per page:</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-[#111827] border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
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
          className="p-1.5 rounded border border-slate-800 bg-[#111827] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#111827] text-slate-300 transition-colors"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          title="Previous Page"
          className="p-1.5 rounded border border-slate-800 bg-[#111827] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#111827] text-slate-300 transition-colors"
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
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'bg-[#111827] text-slate-300 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className="px-1 text-slate-600">
                {p}
              </span>
            )
          )}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          title="Next Page"
          className="p-1.5 rounded border border-slate-800 bg-[#111827] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#111827] text-slate-300 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          title="Last Page"
          className="p-1.5 rounded border border-slate-800 bg-[#111827] hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-[#111827] text-slate-300 transition-colors"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  )
}
