import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HiMenu,
  HiX,
  HiHome,
  HiCreditCard,
  HiInformationCircle,
  HiMail,
  HiViewGrid,
  HiDocumentText,
  HiUsers,
  HiUserGroup,
  HiCog,
  HiUser,
  HiLogout,
} from 'react-icons/hi'

const ADMIN_ROLES = ['super_admin', 'approver', 'viewer']

export default function Navbar() {
  const { user, logout, isRole } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const navigate = useNavigate()

  const closeMobile = () => setMobileOpen(false)

  const handleLogout = () => {
    closeMobile()
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => { setShowLogoutModal(false); logout() }
  const handleLogoutCancel = () => setShowLogoutModal(false)

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-50 text-primary-900'
        : 'text-gray-600 hover:text-primary-900 hover:bg-gray-50'
    }`

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
            <span className="text-xl font-bold text-primary-900">
              Kufre Loans
            </span>
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {!user && (
              <>
                <NavLink to="/" end className={navLinkClass}>
                  <HiHome className="w-4 h-4" />
                  Home
                </NavLink>
                <NavLink to="/products" className={navLinkClass}>
                  <HiCreditCard className="w-4 h-4" />
                  Products
                </NavLink>
                <NavLink to="/about" className={navLinkClass}>
                  <HiInformationCircle className="w-4 h-4" />
                  About
                </NavLink>
                <NavLink to="/contact" className={navLinkClass}>
                  <HiMail className="w-4 h-4" />
                  Contact
                </NavLink>
              </>
            )}

            {user && user.role === 'customer' && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  <HiViewGrid className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/apply" className={navLinkClass}>
                  <HiCreditCard className="w-4 h-4" />
                  Apply
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  <HiUser className="w-4 h-4" />
                  Profile
                </NavLink>
              </>
            )}

            {user && ADMIN_ROLES.includes(user.role) && (
              <>
                <NavLink to="/admin" end className={navLinkClass}>
                  <HiViewGrid className="w-4 h-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/admin/loans" className={navLinkClass}>
                  <HiDocumentText className="w-4 h-4" />
                  Loans
                </NavLink>
                <NavLink to="/admin/customers" className={navLinkClass}>
                  <HiUsers className="w-4 h-4" />
                  Customers
                </NavLink>
                {isRole('super_admin') && (
                  <NavLink to="/admin/team" className={navLinkClass}>
                    <HiUserGroup className="w-4 h-4" />
                    Team
                  </NavLink>
                )}
                {isRole('super_admin') && (
                  <NavLink to="/admin/settings" className={navLinkClass}>
                    <HiCog className="w-4 h-4" />
                    Settings
                  </NavLink>
                )}
              </>
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <HiLogout className="w-4 h-4" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {!user && (
            <>
              <NavLink to="/" end className={navLinkClass} onClick={closeMobile}>
                <HiHome className="w-4 h-4" /> Home
              </NavLink>
              <NavLink to="/products" className={navLinkClass} onClick={closeMobile}>
                <HiCreditCard className="w-4 h-4" /> Products
              </NavLink>
              <NavLink to="/about" className={navLinkClass} onClick={closeMobile}>
                <HiInformationCircle className="w-4 h-4" /> About
              </NavLink>
              <NavLink to="/contact" className={navLinkClass} onClick={closeMobile}>
                <HiMail className="w-4 h-4" /> Contact
              </NavLink>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={closeMobile}
                  className="w-full text-center px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={closeMobile}
                  className="w-full text-center px-4 py-2 text-sm font-medium bg-primary-900 text-white rounded-lg hover:bg-primary-800"
                >
                  Register
                </Link>
              </div>
            </>
          )}

          {user && user.role === 'customer' && (
            <>
              <NavLink to="/dashboard" className={navLinkClass} onClick={closeMobile}>
                <HiViewGrid className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink to="/apply" className={navLinkClass} onClick={closeMobile}>
                <HiCreditCard className="w-4 h-4" /> Apply
              </NavLink>
              <NavLink to="/profile" className={navLinkClass} onClick={closeMobile}>
                <HiUser className="w-4 h-4" /> Profile
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <HiLogout className="w-4 h-4" /> Logout
              </button>
            </>
          )}

          {user && ADMIN_ROLES.includes(user.role) && (
            <>
              <NavLink to="/admin" end className={navLinkClass} onClick={closeMobile}>
                <HiViewGrid className="w-4 h-4" /> Dashboard
              </NavLink>
              <NavLink to="/admin/loans" className={navLinkClass} onClick={closeMobile}>
                <HiDocumentText className="w-4 h-4" /> Loans
              </NavLink>
              <NavLink to="/admin/customers" className={navLinkClass} onClick={closeMobile}>
                <HiUsers className="w-4 h-4" /> Customers
              </NavLink>
              {isRole('super_admin') && (
                <NavLink to="/admin/team" className={navLinkClass} onClick={closeMobile}>
                  <HiUserGroup className="w-4 h-4" /> Team
                </NavLink>
              )}
              {isRole('super_admin') && (
                <NavLink to="/admin/settings" className={navLinkClass} onClick={closeMobile}>
                  <HiCog className="w-4 h-4" /> Settings
                </NavLink>
              )}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
              >
                <HiLogout className="w-4 h-4" /> Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>

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
    </>
  )
}
