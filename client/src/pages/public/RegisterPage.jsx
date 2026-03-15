import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { HiEye, HiEyeOff, HiCheckCircle } from 'react-icons/hi'
import toast from 'react-hot-toast'

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }
  const strength = getStrength(password)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const textColors = ['', 'text-red-600', 'text-yellow-600', 'text-blue-600', 'text-green-600']

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= strength ? colors[strength] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[strength]}`}>
        {labels[strength]} password
      </p>
    </div>
  )
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bvn: '',
    password: '',
    confirm_password: '',
    terms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState(null)

  const handleChange = (e) => {
    setError('')
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    if (!form.first_name.trim()) return 'First name is required.'
    if (!form.last_name.trim()) return 'Last name is required.'
    if (!form.email.trim()) return 'Email address is required.'
    if (!form.phone.trim()) return 'Phone number is required.'
    if (!/^\d{11}$/.test(form.bvn)) return 'BVN must be exactly 11 digits.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirm_password) return 'Passwords do not match.'
    if (!form.terms) return 'You must accept the terms and conditions.'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { confirm_password, terms, ...payload } = form
      const result = await register(payload)
      setSuccessData(result)
      toast.success('Account created successfully!')
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <HiCheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Welcome to Kufre Loans! Your account has been set up successfully.
          </p>
          {successData.user?.account_number && (
            <div className="bg-primary-50 rounded-xl p-4 mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Your Account Number</p>
              <p className="text-2xl font-bold text-primary-900 font-mono tracking-widest">
                {successData.user.account_number}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {successData.user.bank_name || 'Kufre Microfinance Bank'}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">Redirecting you to your dashboard...</p>
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-primary-900 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-900 to-primary-700 text-white p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">Kufre Loans</span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </Link>
        <div>
          <h2 className="text-4xl font-extrabold mb-4 leading-tight">
            Start your financial journey today
          </h2>
          <p className="text-primary-200 text-lg">
            Create a free account and get access to fast, affordable loans in minutes.
          </p>
          <ul className="mt-6 space-y-3">
            {['No registration fee', 'BVN-based instant verification', 'Funds in your account same day'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-primary-100 text-sm">
                <HiCheckCircle className="w-4 h-4 text-green-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-primary-300 text-sm">© {new Date().getFullYear()} Kufre Loans</p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 max-w-2xl w-full mx-auto lg:mx-0 overflow-y-auto">
        <div className="mb-6 flex justify-center lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary-900">Kufre Loans</span>
            <span className="w-2 h-2 rounded-full bg-green-500" />
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-500 mb-6">
          Already registered?{' '}
          <Link to="/login" className="text-primary-900 font-medium hover:underline">
            Sign in
          </Link>
        </p>

        {error && (
          <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="input-field"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="form-label">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email Address <span className="text-red-500">*</span></label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="input-field"
              placeholder="john@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="form-label">Phone Number <span className="text-red-500">*</span></label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="08012345678"
              required
            />
          </div>

          <div>
            <label className="form-label">
              BVN <span className="text-red-500">*</span>
              <span className="ml-1 text-xs text-gray-400 font-normal">(11 digits)</span>
            </label>
            <input
              type="text"
              name="bvn"
              value={form.bvn}
              onChange={handleChange}
              className="input-field"
              placeholder="12345678901"
              maxLength={11}
              pattern="\d{11}"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Your BVN is used for identity verification only. It is encrypted and never shared.
            </p>
          </div>

          <div>
            <label className="form-label">Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="input-field pr-10"
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
              >
                {showPassword ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <label className="form-label">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirm_password"
                value={form.confirm_password}
                onChange={handleChange}
                className="input-field pr-10"
                placeholder="Repeat your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                tabIndex={-1}
              >
                {showConfirm ? <HiEyeOff className="w-5 h-5" /> : <HiEye className="w-5 h-5" />}
              </button>
            </div>
            {form.confirm_password && form.password !== form.confirm_password && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input
              type="checkbox"
              name="terms"
              id="terms"
              checked={form.terms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-900 focus:ring-primary-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 cursor-pointer">
              I agree to the{' '}
              <span className="text-primary-900 hover:underline cursor-pointer">Terms of Service</span>
              {' '}and{' '}
              <span className="text-primary-900 hover:underline cursor-pointer">Privacy Policy</span>
              <span className="text-red-500"> *</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-base mt-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
