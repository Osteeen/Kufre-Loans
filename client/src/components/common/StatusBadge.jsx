import React from 'react'
import { getStatusColor } from '../../utils/api'

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  declined: 'Declined',
  disbursed: 'Disbursed',
  completed: 'Completed',
  active: 'Active',
  inactive: 'Inactive',
  paid: 'Paid',
  overdue: 'Overdue',
  upcoming: 'Upcoming',
}

export default function StatusBadge({ status, size = 'sm' }) {
  const colorClass = getStatusColor(status)
  const label = statusLabels[status] || status?.replace(/_/g, ' ') || 'Unknown'

  const sizeClass = size === 'xs'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${colorClass} ${sizeClass} capitalize`}
    >
      {label}
    </span>
  )
}
