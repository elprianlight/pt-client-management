'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (row: T) => React.ReactNode
  width?: string
}

interface DataTableProps<T extends { id: string }> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKey?: string
  pageSize?: number
  emptyMessage?: string
  isLoading?: boolean
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Cari...',
  pageSize = 10,
  emptyMessage = 'Belum ada data.',
  isLoading = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search) return data
    const term = search.toLowerCase()
    return data.filter(row =>
      Object.values(row as Record<string, unknown>).some(val =>
        typeof val === 'string' && val.toLowerCase().includes(term)
      )
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  return (
    <div className="data-table-wrapper">
      {searchable && (
        <div className="dt-search-bar">
          <Search size={15} className="dt-search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={e => handleSearch(e.target.value)}
            className="dt-search-input"
          />
        </div>
      )}

      <div className="dt-table-container">
        <table className="dt-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={String(col.key)} className="dt-th" style={{ width: col.width }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="dt-tr">
                  {columns.map(col => (
                    <td key={String(col.key)} className="dt-td">
                      <div className="skeleton" style={{ height: 16, width: '70%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="dt-empty">
                  {search ? `Tidak ada hasil untuk "${search}"` : emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map(row => (
                <tr key={row.id} className="dt-tr">
                  {columns.map(col => (
                    <td key={String(col.key)} className="dt-td">
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key as string] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="dt-pagination">
          <span className="dt-page-info">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length}
          </span>
          <div className="dt-page-controls">
            <button onClick={() => setPage(1)} disabled={page === 1} className="dt-page-btn">
              <ChevronsLeft size={14} />
            </button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="dt-page-btn">
              <ChevronLeft size={14} />
            </button>
            <span className="dt-page-num">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="dt-page-btn">
              <ChevronRight size={14} />
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="dt-page-btn">
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .data-table-wrapper { display: flex; flex-direction: column; gap: 16px; }

        .dt-search-bar {
          position: relative;
          max-width: 320px;
        }
        .dt-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .dt-search-input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: all var(--transition-fast);
        }
        .dt-search-input:hover {
          border-color: var(--border-hover);
          background: rgba(0, 0, 0, 0.3);
        }
        .dt-search-input:focus {
          border-color: var(--brand-primary);
          background: rgba(0, 0, 0, 0.4);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }

        .dt-table-container {
          overflow-x: auto;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          background: rgba(15, 17, 23, 0.4);
        }
        .dt-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .dt-th {
          padding: 14px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border-default);
          white-space: nowrap;
        }
        .dt-tr {
          transition: background var(--transition-fast);
        }
        .dt-tr:hover { background: rgba(255, 255, 255, 0.03); }
        .dt-tr:not(:last-child) td { border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
        .dt-td {
          padding: 14px 16px;
          color: var(--text-primary);
          vertical-align: middle;
        }
        .dt-empty {
          padding: 48px 16px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        .dt-pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .dt-page-info { font-size: 13px; color: var(--text-muted); }
        .dt-page-controls { display: flex; align-items: center; gap: 4px; }
        .dt-page-btn {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .dt-page-btn:hover:not(:disabled) {
          background: var(--bg-overlay);
          border-color: var(--border-brand);
          color: var(--text-primary);
        }
        .dt-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .dt-page-num {
          padding: 0 12px;
          font-size: 13px;
          color: var(--text-secondary);
        }

        @media (max-width: 640px) {
          .dt-search-bar {
            display: none;
          }
          .dt-th {
            padding: 10px 8px;
            font-size: 10px;
          }
          .dt-td {
            padding: 10px 8px;
            font-size: 12px;
          }
          .dt-search-input {
            font-size: 12px;
            padding-top: 7px;
            padding-bottom: 7px;
          }
          .dt-table-container {
            border-radius: var(--radius-md);
          }
          .dt-empty {
            padding: 32px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
