import React, { useState } from 'react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { HiMail, HiPhone, HiLocationMarker, HiClock, HiCheckCircle } from 'react-icons/hi'
import toast from 'react-hot-toast'

const contactInfo = [
  {
    icon: HiLocationMarker,
    title: 'Our Office',
    lines: ['14 Admiralty Way, Lekki Phase 1', 'Lagos, Nigeria'],
  },
  {
    icon: HiPhone,
    title: 'Phone',
    lines: ['+234 800 123 4567', '+234 800 765 4321'],
  },
  {
    icon: HiMail,
    title: 'Email',
    lines: ['support@kufreloans.ng', 'info@kufreloans.ng'],
  },
  {
    icon: HiClock,
    title: 'Business Hours',
    lines: ['Mon – Fri: 8:00 AM – 6:00 PM', 'Sat: 9:00 AM – 2:00 PM'],
  },
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    // Simulate sending (no API endpoint for contact form)
    await new Promise((r) => setTimeout(r, 1200))
    setSubmitting(false)
    setSubmitted(true)
    toast.success('Message sent! We will get back to you shortly.')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold mb-4">Get In Touch</h1>
          <p className="text-primary-200 text-lg max-w-xl mx-auto">
            Have questions? Our support team is here to help. Reach out and we'll get back
            to you as soon as possible.
          </p>
        </div>
      </section>

      <section className="bg-gray-50 py-16 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>

                {submitted ? (
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <HiCheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-500 text-sm">
                      Thank you for reaching out. We'll respond to <strong>{form.email}</strong> within 24 hours.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                      className="mt-6 text-sm text-primary-900 font-medium hover:underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="form-label">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="input-field"
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="How can we help?"
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        rows={5}
                        className="input-field resize-none"
                        placeholder="Tell us how we can help..."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Contact Info + Map */}
            <div className="space-y-6">
              {/* Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.map(({ icon: Icon, title, lines }) => (
                  <div
                    key={title}
                    className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary-900" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm">{title}</h3>
                    {lines.map((line, i) => (
                      <p key={i} className="text-sm text-gray-500">{line}</p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-100 h-56 flex items-center justify-center">
                  <div className="text-center">
                    <HiLocationMarker className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Map: 14 Admiralty Way, Lekki Phase 1, Lagos</p>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-primary-900 hover:underline"
                    >
                      View on Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
