import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import api, { formatNaira, formatDate, formatDateTime } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import {
  HiArrowLeft, HiCheckCircle, HiX, HiDocumentText,
  HiDownload, HiPaperAirplane, HiExclamation,
} from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function AdminLoanDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loan, setLoan] = useState(null)
  const [repayments, setRepayments] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Approval form
  const [approvalForm, setApprovalForm] = useState({ amount_approved: '', interest_rate: '' })
  const [approving, setApproving] = useState(false)

  // Decline modal
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const [declining, setDeclining] = useState(false)

  // Disburse modal
  const [showDisburseModal, setShowDisburseModal] = useState(false)
  const [disbursing, setDisbursing] = useState(false)

  // Messages
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const canAct = ['super_admin', 'approver'].includes(user?.role)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loanRes, repayRes, msgRes] = await Promise.all([
          api.get(`/admin/loans/${id}`),
          api.get(`/admin/loans/${id}/repayments`).catch(() => ({ data: [] })),
          api.get(`/admin/loans/${id}/messages`).catch(() => ({ data: [] })),
        ])
        const loanData = loanRes.data?.loan || loanRes.data
        setLoan(loanData)
        setApprovalForm({
          amount_approved: String((loanData?.amount_requested || 0) / 100),
          interest_rate: String(loanData?.interest_rate || 5),
        })
        setRepayments(Array.isArray(repayRes.data?.repayments) ? repayRes.data.repayments : (Array.isArray(repayRes.data) ? repayRes.data : []))
        setMessages(Array.isArray(msgRes.data?.messages) ? msgRes.data.messages : (Array.isArray(msgRes.data) ? msgRes.data : []))
      } catch {
        setError('Failed to load loan details.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleApprove = async (e) => {
    e.preventDefault()
    if (!approvalForm.amount_approved || !approvalForm.interest_rate) {
      toast.error('Please enter approval details')
      return
    }
    setApproving(true)
    try {
      const res = await api.patch(`/admin/loans/${id}/approve`, {
        amount_approved: Number(approvalForm.amount_approved) * 100,
        interest_rate: Number(approvalForm.interest_rate),
      })
      setLoan(res.data?.loan || { ...loan, status: 'approved', ...res.data })
      toast.success('Loan approved successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve loan')
    } finally {
      setApproving(false)
    }
  }

  const handleDecline = async () => {
    if (!declineReason.trim()) {
      toast.error('Please provide a reason for declining')
      return
    }
    setDeclining(true)
    try {
      const res = await api.patch(`/admin/loans/${id}/decline`, { reason: declineReason })
      setLoan(res.data?.loan || { ...loan, status: 'declined', decline_reason: declineReason })
      setShowDeclineModal(false)
      toast.success('Loan declined.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline loan')
    } finally {
      setDeclining(false)
    }
  }

  const handleDisburse = async () => {
    setDisbursing(true)
    try {
      const res = await api.patch(`/admin/loans/${id}/disburse`)
      setLoan(res.data?.loan || { ...loan, status: 'disbursed' })
      setShowDisburseModal(false)
      toast.success('Loan disbursed successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disburse loan')
    } finally {
      setDisbursing(false)
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/admin/loans/${id}/messages`, { message: msgText.trim() })
      const newMsg = res.data?.message || {
        id: Date.now(),
        sender_role: user?.role,
        message: msgText.trim(),
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, newMsg])
      setMsgText('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <AdminLayout><LoadingSpinner text="Loading loan details..." /></AdminLayout>
  if (error || !loan) return (
    <AdminLayout>
      <div className="text-red-600 py-8 text-center">{error || 'Loan not found.'}</div>
    </AdminLayout>
  )

  const canApprove = canAct && ['pending', 'under_review'].includes(loan.status)
  const canDisburse = canAct && loan.status === 'approved'

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/loans')}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <HiArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">Loan #{loan.id}</h1>
            <StatusBadge status={loan.status} />
          </div>
          <p className="text-sm text-gray-500">Applied {formatDate(loan.created_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">

          {/* Customer Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Name', value: `${loan.first_name} ${loan.last_name}` },
                { label: 'Email', value: loan.email },
                { label: 'Phone', value: loan.phone || '—' },
                { label: 'Account Number', value: loan.account_number || '—', mono: true },
                { label: 'Bank', value: loan.bank_name || 'Kufre Microfinance Bank' },
                { label: 'Tier', value: `Tier ${loan.tier || 1}` },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`font-semibold text-gray-900 text-sm ${mono ? 'font-mono' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
            <Link
              to={`/admin/customers/${loan.user_id || loan.customer_id}`}
              className="mt-3 inline-block text-sm text-primary-900 hover:underline font-medium"
            >
              View Full Profile →
            </Link>
          </div>

          {/* Loan Info */}
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Loan Information</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Product', value: loan.product_name || loan.product_type || 'Quick Loan' },
                { label: 'Amount Requested', value: formatNaira(loan.amount_requested) },
                { label: 'Amount Approved', value: loan.amount_approved ? formatNaira(loan.amount_approved) : '—' },
                { label: 'Interest Rate', value: `${loan.interest_rate || 5}%` },
                { label: 'Tenor', value: `${loan.tenor} months` },
                { label: 'Monthly Repayment', value: loan.monthly_repayment ? formatNaira(loan.monthly_repayment) : '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="font-semibold text-gray-900 text-sm">{value}</p>
                </div>
              ))}
            </div>
            {loan.purpose && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Purpose</p>
                <p className="text-sm text-gray-700">{loan.purpose}</p>
              </div>
            )}
          </div>

          {/* Approval/Decline Form */}
          {canApprove && (
            <div className="card border-l-4 border-l-yellow-400">
              <h2 className="font-semibold text-gray-900 mb-4">Review Application</h2>
              <form onSubmit={handleApprove} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label text-xs">Amount to Approve (₦)</label>
                    <input
                      type="number"
                      value={approvalForm.amount_approved}
                      onChange={(e) => setApprovalForm((p) => ({ ...p, amount_approved: e.target.value }))}
                      className="input-field text-sm"
                      min={1}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label text-xs">Interest Rate (%/month)</label>
                    <input
                      type="number"
                      value={approvalForm.interest_rate}
                      onChange={(e) => setApprovalForm((p) => ({ ...p, interest_rate: e.target.value }))}
                      className="input-field text-sm"
                      min={0}
                      step="0.1"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={approving}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {approving ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <HiCheckCircle className="w-4 h-4" />
                    )}
                    Approve Loan
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeclineModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <HiX className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Disburse Button */}
          {canDisburse && (
            <div className="card border-l-4 border-l-green-500">
              <h2 className="font-semibold text-gray-900 mb-2">Ready to Disburse</h2>
              <p className="text-sm text-gray-500 mb-4">
                This loan has been approved. Disburse funds to the customer's bank account.
              </p>
              <button
                onClick={() => setShowDisburseModal(true)}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                <HiCheckCircle className="w-5 h-5" />
                Disburse {formatNaira(loan.amount_approved)} to {loan.account_number || 'Customer Account'}
              </button>
            </div>
          )}

          {/* Repayment Schedule */}
          {repayments.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Repayment Schedule</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">#</th>
                      <th className="text-left px-3 py-2.5 font-medium text-gray-600">Due</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">Principal</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">Interest</th>
                      <th className="text-right px-3 py-2.5 font-medium text-gray-600">Total</th>
                      <th className="text-center px-3 py-2.5 font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {repayments.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5">{r.month_number || i + 1}</td>
                        <td className="px-3 py-2.5">{formatDate(r.due_date)}</td>
                        <td className="px-3 py-2.5 text-right">{formatNaira(r.principal)}</td>
                        <td className="px-3 py-2.5 text-right">{formatNaira(r.interest)}</td>
                        <td className="px-3 py-2.5 text-right font-semibold">{formatNaira(r.total_amount)}</td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={r.status || 'upcoming'} size="xs" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Documents */}
          {loan.documents && loan.documents.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Documents</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {loan.documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                      <HiDocumentText className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate capitalize">
                        {doc.document_type?.replace(/_/g, ' ') || `Document ${idx + 1}`}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</p>
                    </div>
                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                        onClick={(e) => e.stopPropagation()}>
                        <HiDownload className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Messages */}
        <div>
          <div className="card h-full flex flex-col" style={{ minHeight: 400 }}>
            <h2 className="font-semibold text-gray-900 mb-4">Messages</h2>
            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl overflow-hidden flex flex-col">
              <div className="flex-1 h-80 overflow-y-auto p-3 space-y-3 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-gray-400 text-center">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isAdmin = msg.sender_role !== 'customer'
                    return (
                      <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs px-3 py-2 rounded-2xl text-xs ${
                            isAdmin
                              ? 'bg-primary-900 text-white rounded-br-sm'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                          }`}
                        >
                          {!isAdmin && <p className="text-xs font-semibold text-gray-500 mb-0.5">Customer</p>}
                          <p>{msg.message}</p>
                          <p className={`text-xs mt-1 ${isAdmin ? 'text-primary-200' : 'text-gray-400'}`}>
                            {formatDateTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={sendMessage} className="flex items-center gap-2 p-2 bg-white border-t border-gray-200">
                <input
                  type="text"
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={sending || !msgText.trim()}
                  className="p-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50"
                >
                  {sending
                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                    : <HiPaperAirplane className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Decline Loan Application</h3>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a reason for declining. This will be shared with the customer.
            </p>
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
              className="input-field resize-none mb-4"
              placeholder="e.g., Insufficient income documentation..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={declining || !declineReason.trim()}
                className="flex-1 btn-danger py-2.5 flex items-center justify-center gap-2"
              >
                {declining && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disburse Modal */}
      {showDisburseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <HiExclamation className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Confirm Disbursement</h3>
            <p className="text-sm text-gray-500 text-center mb-2">
              You are about to disburse <strong>{formatNaira(loan.amount_approved)}</strong> to:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-5">
              <p className="font-bold text-gray-900">{loan.first_name} {loan.last_name}</p>
              <p className="font-mono text-gray-700">{loan.account_number}</p>
              <p className="text-sm text-gray-500">{loan.bank_name || 'Kufre Microfinance Bank'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisburseModal(false)}
                className="flex-1 btn-secondary py-2.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDisburse}
                disabled={disbursing}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {disbursing && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Disburse Now
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
