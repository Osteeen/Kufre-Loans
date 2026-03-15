import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { useAuth } from '../../context/AuthContext'
import { HiUser, HiMail, HiPhone, HiCreditCard, HiLockClosed, HiInformationCircle } from 'react-icons/hi'

const tierLabels = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }
const tierColors = {
  1: 'bg-gray-100 text-gray-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-purple-100 text-purple-700',
}

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-900 text-white flex items-center justify-center text-2xl font-bold">
            {(user.first_name || 'U').charAt(0)}{(user.last_name || '').charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">{user.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors[user.tier] || tierColors[1]}`}>
                {tierLabels[user.tier] || 'Tier 1'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {[
            { key: 'profile', label: 'Profile Info' },
            { key: 'security', label: 'Security' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary-900 text-primary-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiUser className="w-5 h-5 text-gray-500" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="First Name" value={user.first_name} icon={HiUser} />
                <InfoField label="Last Name" value={user.last_name} icon={HiUser} />
                <InfoField label="Email Address" value={user.email} icon={HiMail} />
                <InfoField label="Phone Number" value={user.phone || '—'} icon={HiPhone} />
              </div>
            </div>

            {/* Account Details */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiCreditCard className="w-5 h-5 text-gray-500" />
                Account Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField
                  label="Account Number"
                  value={user.account_number || '—'}
                  icon={HiCreditCard}
                  mono
                />
                <InfoField
                  label="Bank Name"
                  value={user.bank_name || 'Kufre Microfinance Bank'}
                  icon={HiCreditCard}
                />
                <InfoField
                  label="Account Tier"
                  value={tierLabels[user.tier] || 'Tier 1'}
                  icon={HiInformationCircle}
                />
                <InfoField
                  label="Member Since"
                  value={user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}
                  icon={HiInformationCircle}
                />
              </div>
            </div>

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <HiInformationCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Want to update your information?</p>
                <p className="text-sm text-blue-700">
                  To update your personal details (name, phone number, etc.), please contact our support team
                  at <a href="mailto:support@kufreloans.ng" className="font-medium underline">support@kufreloans.ng</a> or
                  call <a href="tel:+2348001234567" className="font-medium underline">+234 800 123 4567</a>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiLockClosed className="w-5 h-5 text-gray-500" />
                Password & Security
              </h2>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <HiLockClosed className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Password</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your password is encrypted and secure. Last changed: Unknown
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <HiInformationCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">To change your password</p>
                  <p className="text-sm text-blue-700">
                    Use the{' '}
                    <Link to="/forgot-password" className="font-medium underline">
                      forgot password
                    </Link>{' '}
                    feature to reset your password via email.
                  </p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="card border border-red-100">
              <h2 className="font-semibold text-red-700 mb-4">Danger Zone</h2>
              <p className="text-sm text-gray-500 mb-4">
                Logging out will end your current session on this device.
              </p>
              <button
                onClick={logout}
                className="btn-danger px-5 py-2 text-sm"
              >
                Log Out
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function InfoField({ label, value, icon: Icon, mono = false }) {
  return (
    <div>
      <label className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </label>
      <p className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono tracking-wider' : ''}`}>
        {value}
      </p>
    </div>
  )
}
