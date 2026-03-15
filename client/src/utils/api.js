import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

/**
 * Format kobo amount to Naira string
 * @param {number} amountInKobo
 * @returns {string} e.g. "₦500,000.00"
 */
export function formatNaira(amountInKobo) {
  if (amountInKobo === null || amountInKobo === undefined || isNaN(amountInKobo)) {
    return '₦0.00'
  }
  const naira = Number(amountInKobo) / 100
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(naira)
}

/**
 * Format date string to readable format
 * @param {string} dateStr
 * @returns {string} e.g. "Mar 13, 2026"
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr))
  } catch {
    return 'N/A'
  }
}

/**
 * Format date-time string
 * @param {string} dateStr
 * @returns {string} e.g. "Mar 13, 2026, 2:30 PM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'N/A'
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateStr))
  } catch {
    return 'N/A'
  }
}

/**
 * Get Tailwind CSS color classes for a loan status
 * @param {string} status
 * @returns {string} Tailwind classes
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    under_review: 'bg-blue-100 text-blue-800 border-blue-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    declined: 'bg-red-100 text-red-800 border-red-200',
    disbursed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    completed: 'bg-gray-100 text-gray-700 border-gray-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-600 border-gray-200'
}
