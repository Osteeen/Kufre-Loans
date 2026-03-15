import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import EmptyState from '../../components/common/EmptyState'
import api, { formatDate } from '../../utils/api'
import { HiSearch, HiUsers, HiChevronLeft, HiChevronRight } from 'react-icons/hi'

const PAGE_SIZE = 20

const tierColors = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {[...Array(8)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded" />
        </td>
      ))}
    </tr>
  )
}

export default function AdminCustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const debounceRef = useRef(null)

  const fetchCustomers = useCallback(async (q, pg, sort, dir) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pg,
        limit: PAGE_SIZE,
        sort,
        direction: dir,
      })
      if (q) params.set('search', q)
      const res = await api.get(`/admin/users?${params.toString()}`)
      const data = res.data?.data || res.data
      setCustomers(Array.isArray(data.users) ? data.users : (Array.isArray(data) ? data : []))
      setTotal(data.total || 0)
    } catch {
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchCustomers(search, page, sortBy, sortDir)
    }, search ? 300 : 0)
  }, [search, page, sortBy, sortDir, fetchCustomers])

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="text-gray-300 ml-1">↕</span>
    return <span className="text-primary-900 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Customers"
        subtitle={`${total} registered customers`}
      />

      {/* Search */}
      <div className="card mb-6">
        <div className="relative max-w-md">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            className="input-field pl-9 text-sm"
            placeholder="Search by name, email, or phone..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('first_name')}
                >
                  Name <SortIcon field="first_name" />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Account No.</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Tier</th>
                <th
                  className="text-center px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('loan_count')}
                >
                  Loans <SortIcon field="loan_count" />
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                  onClick={() => handleSort('created_at')}
                >
                  Joined <SortIcon field="created_at" />
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16">
                    <EmptyState
                      icon={HiUsers}
                      title="No customers found"
                      description={search ? 'Try a different search term.' : 'No customers have registered yet.'}
                    />
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/customers/${customer.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-900 flex items-center justify-center text-xs font-bold shrink-0">
                          {(customer.first_name || 'U').charAt(0)}{(customer.last_name || '').charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">
                          {customer.first_name} {customer.last_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{customer.phone || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      {customer.account_number || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[customer.tier] || tierColors[1]}`}>
                        Tier {customer.tier || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-700">
                      {customer.loan_count || 0}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(customer.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/admin/customers/${customer.id}`)
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
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
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
