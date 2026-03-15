import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import api, { formatNaira, formatDate, formatDateTime } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import {
  HiArrowLeft,
  HiPaperAirplane,
  HiDownload,
  HiDocumentText,
  HiCheckCircle,
} from 'react-icons/hi'
import toast from 'react-hot-toast'

const STATUS_TIMELINE = [
  { key: 'pending', label: 'Applied' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'disbursed', label: 'Disbursed' },
  { key: 'completed', label: 'Completed' },
]

const statusOrder = { pending: 0, under_review: 1, approved: 2, disbursed: 3, completed: 4, declined: -1 }

export default function CustomerLoanDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [loan, setLoan] = useState(null)
  const [repayments, setRepayments] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msgText, setMsgText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [loanRes, repayRes, msgRes] = await Promise.all([
          api.get(`/customer/loans/${id}`),
          api.get(`/customer/loans/${id}/repayments`).catch(() => ({ data: [] })),
          api.get(`/customer/loans/${id}/messages`).catch(() => ({ data: [] })),
        ])
        setLoan(loanRes.data?.loan || loanRes.data)
        setRepayments(Array.isArray(repayRes.data?.repayments) ? repayRes.data.repayments : (Array.isArray(repayRes.data) ? repayRes.data : []))
        setMessages(Array.isArray(msgRes.data?.messages) ? msgRes.data.messages : (Array.isArray(msgRes.data) ? msgRes.data : []))
      } catch (err) {
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

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!msgText.trim()) return
    setSending(true)
    try {
      const res = await api.post(`/customer/loans/${id}/messages`, { message: msgText.trim() })
      const newMsg = res.data?.message || { id: Date.now(), sender_role: 'customer', message: msgText.trim(), created_at: new Date().toISOString() }
      setMessages((prev) => [...prev, newMsg])
      setMsgText('')
    } catch {
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1"><LoadingSpinner text="Loading loan details..." /></div>
    </div>
  )

  if (error || !loan) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-red-600">{error || 'Loan not found.'}</p>
        <Link to="/dashboard" className="btn-primary px-5 py-2">Back to Dashboard</Link>
      </div>
    </div>
  )

  const currentStatusIdx = statusOrder[loan.status] ?? 0
  const isDeclined = loan.status === 'declined'

  const totalPaid = repayments.filter((r) => r.status === 'paid').reduce((sum, r) => sum + (r.total_amount || 0), 0)
  const totalRemaining = repayments.filter((r) => r.status !== 'paid').reduce((sum, r) => sum + (r.total_amount || 0), 0)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <HiArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">Loan #{loan.id}</h1>
              <StatusBadge status={loan.status} />
            </div>
            <p className="text-sm text-gray-500">Applied on {formatDate(loan.created_at)}</p>
          </div>
        </div>

        {/* Status Timeline */}
        {!isDeclined ? (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Application Progress</h2>
            <div className="flex items-center">
              {STATUS_TIMELINE.map(({ key, label }, idx) => {
                const done = statusOrder[key] < currentStatusIdx
                const active = statusOrder[key] === currentStatusIdx
                return (
                  <React.Fragment key={key}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          done
                            ? 'bg-primary-900 border-primary-900 text-white'
                            : active
                            ? 'border-primary-900 text-primary-900 bg-white'
                            : 'border-gray-200 text-gray-300 bg-white'
                        }`}
                      >
                        {done ? <HiCheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <span className={`mt-1 text-xs hidden sm:block font-medium ${active ? 'text-primary-900' : done ? 'text-gray-600' : 'text-gray-300'}`}>
                        {label}
                      </span>
                    </div>
                    {idx < STATUS_TIMELINE.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${statusOrder[key] < currentStatusIdx ? 'bg-primary-900' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card bg-red-50 border border-red-200">
            <p className="text-red-800 font-semibold">This loan application was declined.</p>
            {loan.decline_reason && (
              <p className="text-red-600 text-sm mt-1">Reason: {loan.decline_reason}</p>
            )}
          </div>
        )}

        {/* Loan Details */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Loan Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: 'Product', value: loan.product_name || loan.product_type || 'Quick Loan' },
              { label: 'Amount Requested', value: formatNaira(loan.amount_requested) },
              { label: 'Amount Approved', value: loan.amount_approved ? formatNaira(loan.amount_approved) : '—' },
              { label: 'Interest Rate', value: `${loan.interest_rate || 5}% per month` },
              { label: 'Tenor', value: `${loan.tenor} months` },
              { label: 'Monthly Repayment', value: loan.monthly_repayment ? formatNaira(loan.monthly_repayment) : '—' },
              { label: 'Total Repayable', value: loan.total_repayable ? formatNaira(loan.total_repayable) : '—' },
              { label: 'Purpose', value: loan.purpose || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="font-semibold text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Repayment Schedule */}
        {repayments.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Repayment Schedule</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">#</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Due Date</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600">Principal</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600">Interest</th>
                    <th className="text-right px-3 py-2.5 font-medium text-gray-600">Total</th>
                    <th className="text-center px-3 py-2.5 font-medium text-gray-600">Status</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-600">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {repayments.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-600">{r.month_number || idx + 1}</td>
                      <td className="px-3 py-2.5 text-gray-900">{formatDate(r.due_date)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-900">{formatNaira(r.principal)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-900">{formatNaira(r.interest)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900">{formatNaira(r.total_amount)}</td>
                      <td className="px-3 py-2.5 text-center">
                        <StatusBadge status={r.status || 'upcoming'} size="xs" />
                      </td>
                      <td className="px-3 py-2.5 text-gray-500">{r.paid_at ? formatDate(r.paid_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-gray-200">
                  <tr className="bg-gray-50 font-semibold">
                    <td colSpan={4} className="px-3 py-2.5 text-gray-700">Summary</td>
                    <td className="px-3 py-2.5 text-right text-gray-900">
                      {formatNaira(repayments.reduce((s, r) => s + (r.total_amount || 0), 0))}
                    </td>
                    <td colSpan={2} className="px-3 py-2.5 text-right text-sm text-gray-500">
                      Paid: {formatNaira(totalPaid)} | Remaining: {formatNaira(totalRemaining)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Documents */}
        {loan.documents && loan.documents.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {loan.documents.map((doc, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <HiDocumentText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.document_type?.replace(/_/g, ' ') || `Document ${idx + 1}`}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(doc.uploaded_at)}</p>
                  </div>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <HiDownload className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Thread */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Messages</h2>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">No messages yet. Start a conversation with our team.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isCustomer = msg.sender_role === 'customer'
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                          isCustomer
                            ? 'bg-primary-900 text-white rounded-br-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                        }`}
                      >
                        {!isCustomer && (
                          <p className="text-xs font-semibold text-primary-700 mb-1">Kufre Team</p>
                        )}
                        <p>{msg.message}</p>
                        <p className={`text-xs mt-1 ${isCustomer ? 'text-primary-200' : 'text-gray-400'}`}>
                          {formatDateTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={sendMessage} className="flex items-center gap-2 p-3 bg-white border-t border-gray-200">
              <input
                type="text"
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Type a message..."
                maxLength={500}
              />
              <button
                type="submit"
                disabled={sending || !msgText.trim()}
                className="p-2 bg-primary-900 text-white rounded-lg hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {sending
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                  : <HiPaperAirplane className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
