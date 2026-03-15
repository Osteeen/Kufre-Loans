import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api, { formatNaira } from '../../utils/api'
import { HiCheckCircle, HiArrowRight } from 'react-icons/hi'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products')
      .then((res) => setProducts(res.data?.data?.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Our Loan Products</h1>
          <p className="text-primary-200 text-lg max-w-2xl mx-auto">
            Simple, transparent, and affordable. Choose the loan product that fits your needs.
            All loans come with no hidden charges and flexible repayment options.
          </p>
        </div>
      </section>

      {/* Product Cards */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <LoadingSpinner />
          ) : products.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No loan products are available at this time.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className={`text-white p-8 ${idx % 2 === 0
                    ? 'bg-gradient-to-br from-primary-800 to-primary-600'
                    : 'bg-gradient-to-br from-primary-950 to-primary-800'}`}
                  >
                    <h2 className="text-2xl font-bold mb-1">{product.name}</h2>
                    {product.description && (
                      <p className="text-primary-100 text-sm">{product.description}</p>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-8">
                    {/* Key Numbers */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {[
                        { label: 'Interest Rate', value: `${parseFloat(product.interest_rate)}% / month` },
                        { label: 'Min Amount', value: formatNaira(product.min_amount) },
                        { label: 'Max Amount', value: formatNaira(product.max_amount) },
                        { label: 'Tenor', value: `${product.min_tenor_months}–${product.max_tenor_months} months` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">{label}</div>
                          <div className="font-semibold text-gray-900 text-sm">{value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {[
                        'No collateral required',
                        'Direct bank transfer',
                        'Flexible repayment terms',
                        'No early repayment penalty',
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                          <HiCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center gap-2 bg-primary-900 text-white py-3 rounded-xl font-semibold hover:bg-primary-800 transition-colors"
                    >
                      Apply Now <HiArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-900 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Apply?</h2>
          <p className="text-primary-200 mb-8">
            Create your free account today and get your loan in minutes.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Get Started Free <HiArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
