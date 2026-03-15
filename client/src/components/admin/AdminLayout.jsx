import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiViewGrid,
  HiDocumentText,
  HiUsers,
  HiUserGroup,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiChevronDown,
  HiClipboardList,
} from 'react-icons/hi'

const navLinks = [
  { to: '/admin', label: 'Dashboard', icon: HiViewGrid, end: true, roles: ['super_admin', 'approver', 'viewer'] },
  { to: '/admin/loans', label: 'Loan Queue', icon: HiDocumentText, roles: ['super_admin', 'approver', 'viewer'] },
  { to: '/admin/customers', label: 'Customers', icon: HiUsers, roles: ['super_admin', 'approver', 'viewer'] },
  { to: '/admin/team', label: 'Team', icon: HiUserGroup, roles: ['super_admin'] },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: HiClipboardList, roles: ['super_admin'] },
  { to: '/admin/settings', label: 'Settings', icon: HiCog, roles: ['super_admin'] },
]

const roleBadgeColors = {
  super_admin: 'bg-purple-100 text-purple-700',
  approver: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
}

const roleLabels = {
  super_admin: 'Super Admin',
  approver: 'Approver',
  viewer: 'Viewer',
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogoutClick = () => setShowLogoutModal(true)
  const handleLogoutConfirm = () => { setShowLogoutModal(false); logout() }
  const handleLogoutCancel = () => setShowLogoutModal(false)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-white text-primary-900'
        : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  const filteredLinks = navLinks.filter((l) => l.roles.includes(user?.role))

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-primary-800">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">Kufre Loans</span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <p className="text-xs text-primary-300 mt-0.5">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={linkClass}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="px-3 py-4 border-t border-primary-800">
        <div className="flex items-center gap-3 mb-3 px-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {(user?.first_name || 'A').charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColors[user?.role] || roleBadgeColors.viewer}`}>
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/80 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <HiLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 bg-primary-900 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary-900 transform transition-transform duration-200 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <HiMenu className="w-6 h-6" />
            </button>
            <div className="hidden sm:block">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-base font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeColors[user?.role] || roleBadgeColors.viewer}`}>
              {roleLabels[user?.role] || user?.role}
            </span>
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-1.5 text-sm text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <HiLogout className="w-4 h-4" />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <HiLogout className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Log out?</h3>
            <p className="text-sm text-gray-500 mb-6">You will be returned to the login screen.</p>
            <div className="flex gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
