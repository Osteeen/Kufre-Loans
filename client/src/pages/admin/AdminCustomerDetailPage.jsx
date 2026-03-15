import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import EmptyState from '../../components/common/EmptyState'
import api, { formatNaira, formatDate } from '../../utils/api'
import { HiArrowLeft, HiCheckCircle, HiDocumentText } from 'react-icons/hi'

const tierColors = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await api.get(`/admin/users/${id}`)
        const data = res.data?.data || res.data
        setCustomer(data.user || data)
        setLoans(data.loans || [])
      } catch {
        setError('Failed to load customer details.')
      } finally {
        setLoading(false)
      }
    }
    fetchCustomer()
  }, [id])

  if (loading) return <AdminLayout><LoadingSpinner text="Loading customer..." /></AdminLayout>
  if (error || !customer) return (
    <AdminLayout>
      <div className="text-red-600 py-8 text-center">{error || 'Customer not found.'}</div>
    </AdminLayout>
  )

  const totalBorrowed = loans
    .filter((l) => ['disbursed', 'completed'].includes(l.status))
    .reduce((sum, l) => sum + (l.amount_approved || l.amount_requested || 0), 0)

  const totalRepaid = loans
    .filter((l) => l.status === 'completed')
    .reduce((sum, l) => sum + (l.total_repayable || l.amount_approved || 0), 0)

  const activeLoan = loans.find((l) => l.status === 'disbursed')

  const initials = `${(customer.first_name || 'U').charAt(0)}${(customer.last_name || '').charAt(0)}`

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/customers')} className="p-2 rounded-lg hover:bg-gray-200">
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Customer Profile</h1>
      </div>

      {/* Customer Header Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary-900 text-white flex items-center justify-center text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="text-xl font-bold text-gray-900">
                {customer.first_name} {customer.last_name}
              </h2>
              {customer.is_verified && (
                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  <HiCheckCircle className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[customer.tier] || tierColors[1]}`}>
                Tier {customer.tier || 1}
              </span>
            </div>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Details */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'First Name', value: customer.first_name },
                { label: 'Last Name', value: customer.last_name },
                { label: 'Email', value: customer.email },
                { label: 'Phone', value: customer.phone || '—' },
                { label: 'Account Number', value: customer.account_number || '—', mono: true },
                { label: 'Bank Name', value: customer.bank_name || 'Kufre Microfinance Bank' },
                {
                  label: 'BVN',
                  value: '•••••••••••',
                  note: 'Hidden for security',
                },
                {
                  label: 'Member Since',
                  value: formatDate(customer.created_at),
                },
              ].map(({ label, value, mono, note }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  <p className={`font-semibold text-gray-900 text-sm ${mono ? 'font-mono tracking-wider' : ''}`}>
                    {value}
                  </p>
                  {note && <p className="text-xs text-gray-400">{note}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Loan History */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Loan History</h2>
            {loans.length === 0 ? (
              <EmptyState
                icon={HiDocumentText}
                title="No loans yet"
                description="This customer hasn't applied for any loans."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Loan ID</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Product</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">Amount</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Status</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Date</th>
                      <th className="px-3 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">
                          #{String(loan.id).padStart(4, '0')}
                        </td>
                        <td className="px-3 py-2.5 text-gray-700">
                          {loan.product_name || loan.product_type || 'Quick Loan'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                          {formatNaira(loan.amount_requested)}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={loan.status} size="xs" />
                        </td>
                        <td className="px-3 py-2.5 text-gray-500">{formatDate(loan.created_at)}</td>
                        <td className="px-3 py-2.5">
                          <button
                            onClick={() => navigate(`/admin/loans/${loan.id}`)}
                            className="text-xs text-primary-900 hover:underline"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: Account Summary */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Account Summary</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">Total Borrowed</p>
                <p className="text-xl font-bold text-gray-900">{formatNaira(totalBorrowed)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Repaid</p>
                <p className="text-xl font-bold text-gray-900">{formatNaira(totalRepaid)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Loans</p>
                <p className="text-xl font-bold text-gray-900">{loans.length}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Loan</p>
                {activeLoan ? (
                  <div>
                    <p className="font-bold text-indigo-700">
                      {formatNaira(activeLoan.amount_approved || activeLoan.amount_requested)}
                    </p>
                    <p className="text-xs text-gray-500">Disbursed and active</p>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-400">None</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
