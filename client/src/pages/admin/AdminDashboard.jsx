import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import PageHeader from '../../components/common/PageHeader'
import api, { formatNaira, formatDate } from '../../utils/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { HiDocumentText, HiCurrencyDollar, HiTrendingUp, HiExclamation } from 'react-icons/hi'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const PIE_COLORS = {
  pending: '#f59e0b',
  under_review: '#3b82f6',
  approved: '#22c55e',
  declined: '#ef4444',
  disbursed: '#6366f1',
  completed: '#9ca3af',
}

function StatCard({ icon: Icon, label, value, subtext, color = 'blue' }) {
  const colorMap = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard')
        setData(res.data?.data || res.data)
      } catch {
        setError('Failed to load dashboard.')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) return <AdminLayout><LoadingSpinner text="Loading dashboard..." /></AdminLayout>
  if (error) return <AdminLayout><div className="text-red-600 p-6">{error}</div></AdminLayout>

  const stats = data || {}
  const recentLoans = data?.recent_applications || []
  const statusDist = data?.status_distribution || {}

  // Build mock monthly disbursement data
  const monthlyData = data?.monthly_disbursements || MONTHS.map((m, i) => ({
    month: m,
    amount: Math.random() * 50000000 + 5000000,
  }))

  // Build pie data
  const pieData = Object.entries(statusDist).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    status,
  })).filter((d) => d.value > 0)

  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of loan operations and platform health."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          icon={HiDocumentText}
          label="Total Applications"
          value={(stats.total_applications || 0).toLocaleString()}
          subtext={`${stats.pending_applications || 0} pending`}
          color="blue"
        />
        <StatCard
          icon={HiCurrencyDollar}
          label="Total Disbursed"
          value={formatNaira(stats.total_disbursed_amount || 0)}
          subtext="All time"
          color="green"
        />
        <StatCard
          icon={HiTrendingUp}
          label="Total Repaid"
          value={formatNaira(stats.total_repaid_amount || 0)}
          subtext={`${(statusDist.disbursed || 0) + (statusDist.approved || 0)} active loans`}
          color="purple"
        />
        <StatCard
          icon={HiExclamation}
          label="Default Rate"
          value={`${(stats.default_rate || 0).toFixed(1)}%`}
          subtext={`${stats.overdue_repayments || 0} overdue payments`}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Bar Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Monthly Disbursements</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `₦${(v / 1000000).toFixed(0)}M`}
                tick={{ fontSize: 11 }}
                width={50}
              />
              <Tooltip
                formatter={(v) => [formatNaira(v), 'Disbursed']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="amount" fill="#1B4332" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Loan Status Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={PIE_COLORS[entry.status] || '#9ca3af'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [v, name.replace(/_/g, ' ')]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend
                  formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {(stats.overdue_repayments > 0 || stats.pending_applications > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {stats.pending_applications > 0 && (
            <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <HiExclamation className="w-5 h-5 text-yellow-500 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 text-sm">Pending Applications</p>
                <p className="text-yellow-700 text-xs">
                  {stats.pending_applications} applications awaiting review
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/loans?status=pending')}
                className="ml-auto text-xs text-yellow-800 underline font-medium"
              >
                View
              </button>
            </div>
          )}
          {stats.overdue_repayments > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <HiExclamation className="w-5 h-5 text-red-500 shrink-0" />
              <div>
                <p className="font-medium text-red-800 text-sm">Overdue Repayments</p>
                <p className="text-red-700 text-xs">
                  {stats.overdue_repayments} overdue repayment(s)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Applications */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Applications</h2>
          <button
            onClick={() => navigate('/admin/loans')}
            className="text-sm text-primary-900 hover:underline font-medium"
          >
            View All
          </button>
        </div>
        {recentLoans.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No loan applications yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Customer</th>
                  <th className="text-right py-2.5 px-2 font-medium text-gray-500">Amount</th>
                  <th className="text-center py-2.5 px-2 font-medium text-gray-500">Status</th>
                  <th className="text-left py-2.5 px-2 font-medium text-gray-500">Date</th>
                  <th className="py-2.5 px-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentLoans.slice(0, 10).map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {loan.first_name} {loan.last_name}
                        </p>
                        <p className="text-xs text-gray-400">{loan.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right font-semibold text-gray-900">
                      {formatNaira(loan.amount_requested)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="py-2.5 px-2 text-gray-500 whitespace-nowrap">
                      {formatDate(loan.created_at)}
                    </td>
                    <td className="py-2.5 px-2">
                      <button
                        onClick={() => navigate(`/admin/loans/${loan.id}`)}
                        className="text-xs text-primary-900 border border-primary-200 px-2.5 py-1 rounded-lg hover:bg-primary-50 transition-colors"
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
    </AdminLayout>
  )
}
