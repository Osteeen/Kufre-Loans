import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api, { formatNaira } from '../../utils/api'
import { HiCheckCircle, HiUpload, HiX, HiArrowLeft, HiArrowRight } from 'react-icons/hi'
import toast from 'react-hot-toast'

const STEPS = ['Select Product', 'Loan Details', 'Documents', 'Review & Submit']

const DOCUMENT_FIELDS = [
  { key: 'government_id', label: 'Government-Issued ID', hint: 'NIN, Passport, or Driver\'s License' },
  { key: 'proof_of_income', label: 'Proof of Income', hint: 'Pay slip, bank statement, or business records' },
  { key: 'bank_statement', label: '6-Month Bank Statement', hint: 'PDF from your bank (last 6 months)' },
  { key: 'utility_bill', label: 'Utility Bill', hint: 'PHCN, water bill (not older than 3 months)' },
]

function formatNairaInput(kobos) {
  return kobos / 100
}

export default function LoanApplicationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [eligibility, setEligibility] = useState(null)
  const [eligibilityLoading, setEligibilityLoading] = useState(true)
  const [loanProducts, setLoanProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  // Form State
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loanDetails, setLoanDetails] = useState({ amount: '', tenor: '', purpose: '' })
  const [documents, setDocuments] = useState({
    government_id: null,
    proof_of_income: null,
    bank_statement: null,
    utility_bill: null,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const res = await api.get('/customer/eligibility')
        setEligibility(res.data)
      } catch {
        setEligibility({ eligible: true, max_amount: 50000000 })
      } finally {
        setEligibilityLoading(false)
      }
    }
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products')
        // Normalise field names from DB to what the component uses
        const products = (res.data?.data?.products || []).map((p) => ({
          ...p,
          min_tenor: p.min_tenor_months,
          max_tenor: p.max_tenor_months,
          interest_rate: parseFloat(p.interest_rate) || 5,
        }))
        setLoanProducts(products)
      } catch {
        setLoanProducts([])
      } finally {
        setProductsLoading(false)
      }
    }
    fetchEligibility()
    fetchProducts()
  }, [])

  const maxAmount = selectedProduct
    ? Math.min(selectedProduct.max_amount, eligibility?.max_amount || selectedProduct.max_amount)
    : 0

  const monthlyRepayment = selectedProduct && loanDetails.amount && loanDetails.tenor
    ? Math.round((Number(loanDetails.amount) * 100 * (1 + selectedProduct.interest_rate / 100)) / Number(loanDetails.tenor))
    : 0

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setLoanDetails({
      amount: String(formatNairaInput(product.min_amount)),
      tenor: String(product.min_tenor),
      purpose: '',
    })
  }

  const handleDocumentChange = (key, file) => {
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }
    setDocuments((prev) => ({ ...prev, [key]: file }))
  }

  const validateStep = () => {
    if (step === 0 && !selectedProduct) {
      toast.error('Please select a loan product')
      return false
    }
    if (step === 1) {
      const amount = Number(loanDetails.amount)
      const tenor = Number(loanDetails.tenor)
      if (!amount || amount * 100 < selectedProduct.min_amount) {
        toast.error(`Minimum amount is ${formatNaira(selectedProduct.min_amount)}`)
        return false
      }
      if (amount * 100 > maxAmount) {
        toast.error(`Maximum amount is ${formatNaira(maxAmount)}`)
        return false
      }
      if (!tenor || tenor < selectedProduct.min_tenor || tenor > selectedProduct.max_tenor) {
        toast.error(`Tenor must be between ${selectedProduct.min_tenor} and ${selectedProduct.max_tenor} months`)
        return false
      }
      if (!loanDetails.purpose.trim()) {
        toast.error('Please enter the purpose of the loan')
        return false
      }
    }
    if (step === 2) {
      const missing = DOCUMENT_FIELDS.filter((d) => !documents[d.key])
      if (missing.length > 0) {
        toast.error(`Please upload: ${missing.map((d) => d.label).join(', ')}`)
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('product_id', String(selectedProduct.id))
      formData.append('amount_requested', String(Number(loanDetails.amount) * 100))
      formData.append('tenor_months', loanDetails.tenor)
      formData.append('purpose', loanDetails.purpose)
      Object.entries(documents).forEach(([key, file]) => {
        if (file) formData.append(key, file)
      })

      await api.post('/customer/loans/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Loan application submitted successfully!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit application. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (eligibilityLoading || productsLoading) return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1"><LoadingSpinner text="Loading..." /></div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Eligibility Banner */}
        {eligibility && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            eligibility.eligible
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
          }`}>
            <HiCheckCircle className="w-5 h-5 shrink-0" />
            {eligibility.eligible
              ? `You are eligible to borrow up to ${formatNaira(eligibility.max_amount)}`
              : (eligibility.reason || 'You currently have an active loan.')}
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center">
            {STEPS.map((label, idx) => (
              <React.Fragment key={label}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                      idx < step
                        ? 'bg-primary-900 border-primary-900 text-white'
                        : idx === step
                        ? 'border-primary-900 text-primary-900 bg-white'
                        : 'border-gray-300 text-gray-400 bg-white'
                    }`}
                  >
                    {idx < step ? <HiCheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`mt-1 text-xs font-medium hidden sm:block ${idx === step ? 'text-primary-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < step ? 'bg-primary-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{STEPS[step]}</h2>

          {/* STEP 0: Select Product */}
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loanProducts.length === 0 && (
                <p className="col-span-2 text-center text-gray-500 py-8">No loan products available at this time.</p>
              )}
              {loanProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`text-left p-5 rounded-xl border-2 transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-primary-900 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900">{product.name}</h3>
                    {selectedProduct?.id === product.id && (
                      <HiCheckCircle className="w-5 h-5 text-primary-900" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">{product.description}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Interest', value: `${product.interest_rate}%/mo` },
                      { label: 'Min', value: formatNaira(product.min_amount) },
                      { label: 'Max', value: formatNaira(product.max_amount) },
                      { label: 'Tenor', value: `${product.min_tenor}–${product.max_tenor} mo` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-semibold text-gray-900">{value}</p>
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1: Loan Details */}
          {step === 1 && selectedProduct && (
            <div className="space-y-5">
              <div>
                <label className="form-label">
                  Loan Amount (₦)
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    Min: {formatNaira(selectedProduct.min_amount)} — Max: {formatNaira(maxAmount)}
                  </span>
                </label>
                <input
                  type="number"
                  value={loanDetails.amount}
                  onChange={(e) => setLoanDetails((p) => ({ ...p, amount: e.target.value }))}
                  min={selectedProduct.min_amount / 100}
                  max={maxAmount / 100}
                  className="input-field text-xl font-bold"
                  placeholder={String(selectedProduct.min_amount / 100)}
                />
                <input
                  type="range"
                  min={selectedProduct.min_amount / 100}
                  max={maxAmount / 100}
                  step={1000}
                  value={loanDetails.amount || selectedProduct.min_amount / 100}
                  onChange={(e) => setLoanDetails((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full mt-2 accent-primary-900"
                />
                {loanDetails.amount && (
                  <p className="mt-1 text-sm font-medium text-primary-900">
                    Borrowing: {formatNaira(Number(loanDetails.amount) * 100)}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label">
                  Repayment Tenor (Months)
                  <span className="ml-2 text-xs text-gray-400 font-normal">
                    {selectedProduct.min_tenor}–{selectedProduct.max_tenor} months
                  </span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {Array.from(
                    { length: selectedProduct.max_tenor - selectedProduct.min_tenor + 1 },
                    (_, i) => i + selectedProduct.min_tenor
                  ).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setLoanDetails((p) => ({ ...p, tenor: String(m) }))}
                      className={`w-12 h-12 rounded-xl text-sm font-semibold border-2 transition-colors ${
                        String(loanDetails.tenor) === String(m)
                          ? 'bg-primary-900 border-primary-900 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-primary-300'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly repayment preview */}
              {monthlyRepayment > 0 && (
                <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Estimated Monthly Repayment</p>
                  <p className="text-2xl font-bold text-primary-900">{formatNaira(monthlyRepayment)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total repayable: {formatNaira(monthlyRepayment * Number(loanDetails.tenor))} over {loanDetails.tenor} months at {selectedProduct.interest_rate}% per month
                  </p>
                </div>
              )}

              <div>
                <label className="form-label">Purpose of Loan <span className="text-red-500">*</span></label>
                <textarea
                  value={loanDetails.purpose}
                  onChange={(e) => setLoanDetails((p) => ({ ...p, purpose: e.target.value }))}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Describe why you need this loan..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">{loanDetails.purpose.length}/500 characters</p>
              </div>
            </div>
          )}

          {/* STEP 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 mb-4">
                Please upload the following documents. Each file must be less than 5MB.
                Accepted formats: PDF, JPG, PNG.
              </p>
              {DOCUMENT_FIELDS.map(({ key, label, hint }) => (
                <div key={key} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                    </div>
                    {documents[key] && (
                      <button
                        onClick={() => setDocuments((p) => ({ ...p, [key]: null }))}
                        className="text-red-400 hover:text-red-600"
                      >
                        <HiX className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  {documents[key] ? (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
                      <HiCheckCircle className="w-4 h-4" />
                      {documents[key].name}
                      <span className="text-gray-400 ml-auto text-xs">
                        ({(documents[key].size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : (
                    <label className="mt-3 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-primary-400 transition-colors">
                      <HiUpload className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-sm text-gray-500">Click to upload</span>
                      <span className="text-xs text-gray-400">PDF, JPG, PNG (max 5MB)</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => handleDocumentChange(key, e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Review & Submit */}
          {step === 3 && selectedProduct && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                Please review your application details before submitting.
              </p>

              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-gray-900">Loan Summary</h3>
                {[
                  { label: 'Product', value: selectedProduct.name },
                  { label: 'Amount Requested', value: formatNaira(Number(loanDetails.amount) * 100) },
                  { label: 'Repayment Tenor', value: `${loanDetails.tenor} months` },
                  { label: 'Interest Rate', value: `${selectedProduct.interest_rate}% per month` },
                  { label: 'Est. Monthly Repayment', value: formatNaira(monthlyRepayment) },
                  { label: 'Total Repayable', value: formatNaira(monthlyRepayment * Number(loanDetails.tenor)) },
                  { label: 'Purpose', value: loanDetails.purpose },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900 text-right max-w-xs">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Documents</h3>
                <div className="space-y-2">
                  {DOCUMENT_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <HiCheckCircle className={`w-4 h-4 ${documents[key] ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={documents[key] ? 'text-gray-900' : 'text-gray-400'}>{label}</span>
                      {documents[key] && (
                        <span className="text-gray-400 text-xs ml-auto">{documents[key].name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                By submitting this application, you confirm that all information provided is accurate and authorize
                Kufre Loans to verify your details via BVN and other available databases.
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step > 0 ? setStep((s) => s - 1) : navigate('/dashboard')}
            className="flex items-center gap-2 btn-secondary px-5 py-2.5"
          >
            <HiArrowLeft className="w-4 h-4" />
            {step === 0 ? 'Cancel' : 'Back'}
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 btn-primary px-5 py-2.5"
            >
              Next <HiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 btn-primary px-6 py-2.5"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application <HiCheckCircle className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
