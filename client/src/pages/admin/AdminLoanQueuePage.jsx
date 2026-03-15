import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import api, { formatNaira, formatDate } from '../../utils/api'
import { HiSearch, HiX, HiDownload, HiDocumentText, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'declined', label: 'Declined' },
  { value: 'disbursed', label: 'Disbursed' },
  { value: 'completed', label: 'Completed' },
]

const PAGE_SIZE = 20

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminLoanQueuePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [loans, setLoans] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    search: '',
    dateFrom: '',
    dateTo: '',
  })

  const debounceRef = useRef(null)

  const fetchLoans = useCallback(async (currentFilters, currentPage) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (currentFilters.status) params.set('status', currentFilters.status)
      if (currentFilters.search) params.set('search', currentFilters.search)
      if (currentFilters.dateFrom) params.set('date_from', currentFilters.dateFrom)
      if (currentFilters.dateTo) params.set('date_to', currentFilters.dateTo)
      params.set('page', currentPage)
      params.set('limit', PAGE_SIZE)

      const res = await api.get(`/admin/loans?${params.toString()}`)
      const data = res.data?.data || res.data
      setLoans(Array.isArray(data.loans) ? data.loans : (Array.isArray(data) ? data : []))
      setTotal(data.total || 0)
    } catch {
      setLoans([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchLoans(filters, page)
    }, filters.search ? 300 : 0)
    return () => clearTimeout(debounceRef.current)
  }, [filters, page, fetchLoans])

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setPage(1)
    setFilters({ status: '', search: '', dateFrom: '', dateTo: '' })
  }

  const hasFilters = filters.status || filters.search || filters.dateFrom || filters.dateTo

  const exportCsv = () => {
    if (!loans.length) return
    const headers = ['ID', 'Customer', 'Email', 'Product', 'Amount', 'Tenor', 'Status', 'Date Applied']
    const rows = loans.map((l) => [
      l.id,
      `${l.first_name} ${l.last_name}`,
      l.email,
      l.product_name || l.product_type || '',
      l.amount_requested / 100,
      `${l.tenor} months`,
      l.status,
      formatDate(l.created_at),
    ])
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kufre-loans-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  return (
    <AdminLayout>
      <PageHeader
        title="Loan Queue"
        subtitle={`${total} total applications`}
        action={
          <button
            onClick={exportCsv}
            disabled={!loans.length}
            className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <HiDownload className="w-4 h-4" />
            Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-44">
            <label className="form-label text-xs">Search</label>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Name, email, or loan ID..."
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>

          {/* Status */}
          <div className="min-w-40">
            <label className="form-label text-xs">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="input-field text-sm"
            >
              {STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-36">
            <label className="form-label text-xs">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {/* Date To */}
          <div className="min-w-36">
            <label className="form-label text-xs">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className="input-field text-sm"
            />
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HiX className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Loan ID', 'Customer', 'Product', 'Amount', 'Tenor', 'Status', 'Applied', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16">
                    <EmptyState
                      icon={HiDocumentText}
                      title="No loans found"
                      description={hasFilters ? 'Try adjusting your filters.' : 'No loan applications yet.'}
                    />
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr
                    key={loan.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/loans/${loan.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      #{String(loan.id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{loan.first_name} {loan.last_name}</p>
                      <p className="text-xs text-gray-400">{loan.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {loan.product_name || loan.product_type || 'Quick Loan'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                      {formatNaira(loan.amount_requested)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{loan.tenor} mo.</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(loan.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/loans/${loan.id}`)
                        }}
                        className="text-xs px-3 py-1.5 border border-primary-200 text-primary-900 rounded-lg hover:bg-primary-50 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
