import React from 'react'
import { Link } from 'react-router-dom'
import { HiMail, HiPhone, HiLocationMarker } from 'react-icons/hi'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-white">Kufre Loans</span>
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Fast, flexible, and transparent loans for every Nigerian. Your financial
              freedom starts here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Home', to: '/' },
                { label: 'Loan Products', to: '/products' },
                { label: 'About Us', to: '/about' },
                { label: 'Contact', to: '/contact' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'Apply for Loan', to: '/apply' },
                { label: 'My Dashboard', to: '/dashboard' },
              ].map(({ label, to }) => (
                <li key={label}>
                  <Link
                    to={to}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <HiLocationMarker className="w-4 h-4 mt-0.5 text-green-400 shrink-0" />
                <span className="text-gray-400">
                  14 Admiralty Way, Lekki Phase 1,<br />
                  Lagos, Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2">
                <HiPhone className="w-4 h-4 text-green-400 shrink-0" />
                <a
                  href="tel:+2348001234567"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  +234 800 123 4567
                </a>
              </li>
              <li className="flex items-center gap-2">
                <HiMail className="w-4 h-4 text-green-400 shrink-0" />
                <a
                  href="mailto:support@kufreloans.ng"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  support@kufreloans.ng
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {year} Kufre Loans. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer transition-colors">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
