import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

// Public Pages
import HomePage from './pages/public/HomePage'
import ProductsPage from './pages/public/ProductsPage'
import AboutPage from './pages/public/AboutPage'
import ContactPage from './pages/public/ContactPage'
import LoginPage from './pages/public/LoginPage'
import RegisterPage from './pages/public/RegisterPage'
import ForgotPasswordPage from './pages/public/ForgotPasswordPage'
import ResetPasswordPage from './pages/public/ResetPasswordPage'

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard'
import LoanApplicationPage from './pages/customer/LoanApplicationPage'
import CustomerLoanDetailPage from './pages/customer/CustomerLoanDetailPage'
import ProfilePage from './pages/customer/ProfilePage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLoanQueuePage from './pages/admin/AdminLoanQueuePage'
import AdminLoanDetailPage from './pages/admin/AdminLoanDetailPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'
import AdminCustomerDetailPage from './pages/admin/AdminCustomerDetailPage'
import AdminTeamPage from './pages/admin/AdminTeamPage'
import AdminSettingsPage from './pages/admin/AdminSettingsPage'
import AdminAuditLogPage from './pages/admin/AdminAuditLogPage'

const ADMIN_ROLES = ['super_admin', 'approver', 'viewer']

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-900 border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect to appropriate area based on actual role
    if (user.role === 'customer') {
      return <Navigate to="/dashboard" replace />
    }
    if (ADMIN_ROLES.includes(user.role)) {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Customer Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apply"
        element={
          <ProtectedRoute roles={['customer']}>
            <LoanApplicationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans/:id"
        element={
          <ProtectedRoute roles={['customer']}>
            <CustomerLoanDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['customer']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/loans"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminLoanQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/loans/:id"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminLoanDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminCustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers/:id"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminCustomerDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/team"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminTeamPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute roles={ADMIN_ROLES}>
            <AdminSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit-logs"
        element={
          <ProtectedRoute roles={['super_admin']}>
            <AdminAuditLogPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
