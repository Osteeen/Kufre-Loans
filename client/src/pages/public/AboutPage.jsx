import React from 'react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { HiEye, HiHeart, HiShieldCheck, HiLightningBolt, HiUsers } from 'react-icons/hi'

const team = [
  {
    name: 'Kufre Etim',
    role: 'Founder & CEO',
    initials: 'KE',
    bio: 'Fintech entrepreneur with 12+ years in Nigerian financial services. Previously led digital banking at a major commercial bank.',
  },
  {
    name: 'Ngozi Adetokunbo',
    role: 'Chief Risk Officer',
    initials: 'NA',
    bio: 'Risk management expert with deep experience in consumer lending and credit analysis across West Africa.',
  },
  {
    name: 'Tunde Fashola',
    role: 'Head of Technology',
    initials: 'TF',
    bio: 'Software architect and fintech builder. Passionate about building scalable, secure financial platforms for Africa.',
  },
]

const values = [
  {
    icon: HiShieldCheck,
    title: 'Transparency',
    description: 'No hidden fees, no fine print surprises. Every charge is clearly stated upfront.',
  },
  {
    icon: HiHeart,
    title: 'Customer First',
    description: "Our customers are at the heart of every decision we make. Your success is our success.",
  },
  {
    icon: HiLightningBolt,
    title: 'Speed & Efficiency',
    description: "We believe your time is valuable. That's why we built systems that work fast for you.",
  },
  {
    icon: HiUsers,
    title: 'Inclusion',
    description: 'Financial services should be accessible to everyone, regardless of income level or location.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold mb-4">About Kufre Loans</h1>
            <p className="text-primary-200 text-lg leading-relaxed">
              We are on a mission to democratize access to credit in Nigeria — making fast, fair,
              and transparent loans available to every hardworking Nigerian.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-primary-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-primary-900 rounded-xl flex items-center justify-center mb-4">
                <HiLightningBolt className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To provide fast, affordable, and transparent financial solutions to Nigerians,
                empowering individuals and businesses to achieve their goals without the barriers
                of traditional banking. We use technology to make lending simple, fair, and accessible.
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-8">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4">
                <HiEye className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To become Nigeria's most trusted digital lending platform — a financial partner
                that Nigerians can rely on throughout their financial journey, from their first
                personal loan to scaling their businesses to greater heights.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Kufre Loans was founded in 2021 with a simple observation: millions of Nigerians
              needed access to credit but were being underserved by traditional banks with lengthy
              processes, high barriers to entry, and opaque terms.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our founder, Kufre Etim, experienced this firsthand when a family member needed an
              emergency loan and was turned away by three different banks. He decided to build a
              solution — one that would use technology to verify identity, assess creditworthiness,
              and disburse funds within hours instead of weeks.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Today, Kufre Loans has disbursed over ₦2 billion to more than 10,000 customers
              across Nigeria, maintaining one of the highest customer satisfaction scores in the
              Nigerian fintech space.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-primary-900" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Meet Our Team</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Our leadership team brings decades of experience in finance, technology, and
              customer service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map(({ name, role, initials, bio }) => (
              <div
                key={name}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-primary-900 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {initials}
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{name}</h3>
                <p className="text-sm text-primary-700 font-medium mb-3">{role}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
