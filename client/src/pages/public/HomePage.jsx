import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import {
  HiLightningBolt,
  HiRefresh,
  HiShieldCheck,
  HiCheckCircle,
  HiStar,
  HiArrowRight,
} from 'react-icons/hi'

const features = [
  {
    icon: HiLightningBolt,
    title: 'Lightning Fast Approval',
    description:
      'Get your loan approved within minutes. Our automated system reviews your application instantly, so you never have to wait days for a decision.',
  },
  {
    icon: HiRefresh,
    title: 'Flexible Repayment',
    description:
      'Choose repayment terms that fit your budget — from 1 to 12 months. Pay monthly with no hidden charges or early repayment penalties.',
  },
  {
    icon: HiShieldCheck,
    title: '100% Secure',
    description:
      'Your data is protected with bank-grade encryption. We are licensed by the CBN and adhere to the highest standards of financial security.',
  },
]

const steps = [
  {
    number: '01',
    icon: HiCheckCircle,
    title: 'Register & Get Verified',
    description: 'Create your account in under 2 minutes. Verify your BVN for instant eligibility assessment.',
  },
  {
    number: '02',
    icon: HiCheckCircle,
    title: 'Apply for a Loan',
    description: 'Select your loan product, enter the amount, and upload the required documents online.',
  },
  {
    number: '03',
    icon: HiCheckCircle,
    title: 'Get Approved',
    description: 'Our team reviews and approves your loan — usually within 30 minutes during business hours.',
  },
  {
    number: '04',
    icon: HiCheckCircle,
    title: 'Receive Funds',
    description: 'Approved funds are disbursed directly to your bank account. No branch visit required.',
  },
]

const loanProducts = [
  {
    name: 'Quick Loan',
    description: 'Perfect for personal emergencies and short-term needs. Fast approval with minimal paperwork.',
    rate: '5% per month',
    min: '₦10,000',
    max: '₦500,000',
    tenor: '1–6 months',
    color: 'from-primary-800 to-primary-600',
  },
  {
    name: 'Business Loan',
    description: 'Fuel your business growth with larger loan amounts and extended repayment terms.',
    rate: '5% per month',
    min: '₦100,000',
    max: '₦5,000,000',
    tenor: '3–12 months',
    color: 'from-primary-900 to-primary-700',
  },
]

const testimonials = [
  {
    name: 'Amara Okafor',
    role: 'Small Business Owner, Lagos',
    text: 'Kufre Loans saved my business! I got ₦500,000 approved within an hour and was able to restock before the festive season. The process was completely online and seamless.',
    stars: 5,
  },
  {
    name: 'Chukwuemeka Eze',
    role: 'Civil Servant, Abuja',
    text: 'I needed funds urgently for a medical emergency. Kufre disbursed the money in less than 2 hours. The repayment schedule is clear and the interest is very fair.',
    stars: 5,
  },
  {
    name: 'Fatimah Bello',
    role: 'Entrepreneur, Kano',
    text: 'Best loan experience in Nigeria. No stress, no hidden charges, no long queues. I have taken three loans from Kufre and the service keeps getting better.',
    stars: 5,
  },
]

function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <HiStar key={i} className="w-4 h-4 text-yellow-400" />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-block mb-4 px-3 py-1 bg-white/10 rounded-full text-sm font-medium text-green-300">
              CBN Licensed & Regulated
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Fast, Flexible Loans for{' '}
              <span className="text-green-400">Every Nigerian</span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 mb-8 leading-relaxed max-w-2xl">
              Get the funds you need in minutes — not days. Apply online, get approved fast,
              and receive money directly in your bank account. No collateral required.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-colors text-base"
              >
                Get Started
                <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors text-base"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl">
            {[
              { value: '₦2B+', label: 'Disbursed' },
              { value: '10,000+', label: 'Customers' },
              { value: '98%', label: 'Approval Rate' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{value}</div>
                <div className="text-sm text-primary-200 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Why Choose Kufre Loans?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              We have built Nigeria's most customer-friendly lending platform. Here's what sets us apart.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-900" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Getting a loan from Kufre is incredibly simple. Four easy steps to financial freedom.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
                  <div className="text-4xl font-extrabold text-primary-100 mb-4">{number}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Loan Products Preview */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Our Loan Products</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Choose from our range of flexible loan products designed to meet different financial needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {loanProducts.map((product) => (
              <div
                key={product.name}
                className={`bg-gradient-to-br ${product.color} text-white rounded-2xl p-8`}
              >
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-primary-100 text-sm mb-6 leading-relaxed">{product.description}</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Interest Rate', value: product.rate },
                    { label: 'Min Amount', value: product.min },
                    { label: 'Max Amount', value: product.max },
                    { label: 'Tenor', value: product.tenor },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="text-xs text-primary-200 uppercase tracking-wide mb-1">{label}</div>
                      <div className="font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-white text-primary-900 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-primary-50 transition-colors"
                >
                  Apply Now <HiArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-primary-900 font-medium hover:underline"
            >
              View All Products & Compare <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
            <p className="text-gray-500">Join thousands of Nigerians who trust Kufre Loans.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, role, text, stars }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <StarRating count={stars} />
                <p className="mt-4 text-sm text-gray-600 leading-relaxed">"{text}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-900 font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{name}</div>
                    <div className="text-xs text-gray-500">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Your Loan?
          </h2>
          <p className="text-primary-200 mb-8 text-lg">
            Join over 10,000 Nigerians who have trusted Kufre Loans for their financial needs.
            Register today and get approved in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-3 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl transition-colors"
            >
              Create Free Account
              <HiArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-colors"
            >
              Login to Dashboard
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
