import React, { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import api, { formatNaira } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import {
  HiSave, HiLockClosed, HiInformationCircle,
  HiPlus, HiPencil, HiTrash, HiCheckCircle, HiXCircle, HiX,
} from 'react-icons/hi'
import toast from 'react-hot-toast'

const DEFAULT_SETTINGS = {
  interest_rate: '5',
  tier1_max_amount: '50000000',
  tier2_max_amount: '200000000',
  tier3_max_amount: '500000000',
  platform_name: 'Kufre Loans',
  support_email: 'support@kufreloans.ng',
}

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  min_amount_naira: '',
  max_amount_naira: '',
  min_tenor_months: '',
  max_tenor_months: '',
}

export default function AdminSettingsPage() {
  const { isRole } = useAuth()
  const isSuperAdmin = isRole('super_admin')

  // ── Platform Settings ────────────────────────────────────────────────────
  const [form, setForm] = useState({
    interest_rate: '5',
    tier1_max_naira: '500000',
    tier2_max_naira: '2000000',
    tier3_max_naira: '5000000',
    platform_name: 'Kufre Loans',
    support_email: 'support@kufreloans.ng',
  })
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  // Track which platform fields are in edit mode
  const [editingField, setEditingField] = useState(null) // 'platform_name' | 'support_email' | null
  const [editingValue, setEditingValue] = useState('')

  // ── Loan Products ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null) // null = create mode
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT)
  const [savingProduct, setSavingProduct] = useState(false)
  const [productError, setProductError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  // ── Load Settings ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings')
        const data = res.data?.data?.settings || {}
        if (Object.keys(data).length > 0) {
          setForm({
            interest_rate: String(data.interest_rate ?? 5),
            tier1_max_naira: String((data.tier1_max_amount ?? 50000000) / 100),
            tier2_max_naira: String((data.tier2_max_amount ?? 200000000) / 100),
            tier3_max_naira: String((data.tier3_max_amount ?? 500000000) / 100),
            platform_name: data.platform_name ?? 'Kufre Loans',
            support_email: data.support_email ?? 'support@kufreloans.ng',
          })
        }
      } catch {
        // use defaults
      } finally {
        setLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  // ── Load Products ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await api.get('/admin/products')
      setProducts(res.data?.data?.products || [])
    } catch {
      // silent
    } finally {
      setLoadingProducts(false)
    }
  }

  // ── Settings Submit ───────────────────────────────────────────────────────
  const handleSettingsChange = (e) => {
    setSettingsError('')
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSettingsSubmit = async (e) => {
    e.preventDefault()
    if (!isSuperAdmin) return
    const rate = Number(form.interest_rate)
    if (!rate || rate < 0 || rate > 100) {
      setSettingsError('Interest rate must be between 0 and 100.')
      return
    }
    setSavingSettings(true)
    setSettingsError('')
    try {
      await api.put('/admin/settings', {
        interest_rate: rate,
        tier1_max_amount: Math.round(Number(form.tier1_max_naira) * 100),
        tier2_max_amount: Math.round(Number(form.tier2_max_naira) * 100),
        tier3_max_amount: Math.round(Number(form.tier3_max_naira) * 100),
        platform_name: form.platform_name,
        support_email: form.support_email,
      })
      toast.success('Settings saved successfully!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save settings.'
      setSettingsError(msg)
      toast.error(msg)
    } finally {
      setSavingSettings(false)
    }
  }

  // ── Product Modal ─────────────────────────────────────────────────────────
  function openCreateModal() {
    setEditingProduct(null)
    setProductForm(EMPTY_PRODUCT)
    setProductError('')
    setShowProductModal(true)
  }

  function openEditModal(product) {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      description: product.description || '',
      min_amount_naira: String(product.min_amount / 100),
      max_amount_naira: String(product.max_amount / 100),
      min_tenor_months: String(product.min_tenor_months),
      max_tenor_months: String(product.max_tenor_months),
    })
    setProductError('')
    setShowProductModal(true)
  }

  function closeModal() {
    setShowProductModal(false)
    setEditingProduct(null)
    setProductForm(EMPTY_PRODUCT)
    setProductError('')
  }

  const handleProductFormChange = (e) => {
    setProductError('')
    setProductForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleProductSubmit = async (e) => {
    e.preventDefault()
    setProductError('')

    const minAmt = Math.round(Number(productForm.min_amount_naira) * 100)
    const maxAmt = Math.round(Number(productForm.max_amount_naira) * 100)
    const minTenor = parseInt(productForm.min_tenor_months, 10)
    const maxTenor = parseInt(productForm.max_tenor_months, 10)

    if (!productForm.name.trim()) { setProductError('Product name is required.'); return }
    if (!minAmt || minAmt < 1) { setProductError('Minimum amount must be greater than 0.'); return }
    if (!maxAmt || maxAmt < minAmt) { setProductError('Maximum amount must be greater than minimum amount.'); return }
    if (!minTenor || minTenor < 1) { setProductError('Minimum tenor must be at least 1 month.'); return }
    if (!maxTenor || maxTenor < minTenor) { setProductError('Maximum tenor must be ≥ minimum tenor.'); return }

    setSavingProduct(true)
    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        min_amount: minAmt,
        max_amount: maxAmt,
        min_tenor_months: minTenor,
        max_tenor_months: maxTenor,
      }

      if (editingProduct) {
        await api.put(`/admin/products/${editingProduct.id}`, payload)
        toast.success('Product updated successfully!')
      } else {
        await api.post('/admin/products', payload)
        toast.success('Product created successfully!')
      }

      closeModal()
      fetchProducts()
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save product.'
      setProductError(msg)
    } finally {
      setSavingProduct(false)
    }
  }

  const handleToggleActive = async (product) => {
    try {
      await api.put(`/admin/products/${product.id}`, { is_active: !product.is_active })
      toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'}.`)
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product.')
    }
  }

  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return
    setDeletingId(product.id)
    try {
      await api.delete(`/admin/products/${product.id}`)
      toast.success('Product deleted.')
      fetchProducts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loadingSettings) return <AdminLayout><LoadingSpinner /></AdminLayout>

  return (
    <AdminLayout>
      <PageHeader
        title="Platform Settings"
        subtitle="Configure loan terms, tier limits, and manage loan products."
      />

      {!isSuperAdmin && (
        <div className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <HiLockClosed className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-yellow-800 text-sm">Read-Only Access</p>
            <p className="text-yellow-700 text-xs">Only Super Admins can edit settings.</p>
          </div>
        </div>
      )}

      {/* ── Platform Settings Form ── */}
      <form onSubmit={handleSettingsSubmit} className="space-y-6 mb-10">
        {settingsError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {settingsError}
          </div>
        )}

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-5">Loan Settings</h2>
          <div className="space-y-4">
            {[
              { key: 'interest_rate', label: 'Interest Rate', type: 'number', display: `${form.interest_rate}% per month`, hint: 'Applied to all new loans.', min: 0, max: 100, step: '0.1' },
              { key: 'tier1_max_naira', label: 'Tier 1 Max Amount', type: 'number', display: formatNaira(Number(form.tier1_max_naira) * 100), hint: 'Maximum loan amount for Tier 1 customers.', min: 0 },
              { key: 'tier2_max_naira', label: 'Tier 2 Max Amount', type: 'number', display: formatNaira(Number(form.tier2_max_naira) * 100), hint: 'Maximum loan amount for Tier 2 customers.', min: 0 },
              { key: 'tier3_max_naira', label: 'Tier 3 Max Amount', type: 'number', display: formatNaira(Number(form.tier3_max_naira) * 100), hint: 'Maximum loan amount for Tier 3 customers.', min: 0 },
            ].map(({ key, label, type, display, hint, min, max, step }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  {editingField === key ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type={type}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="input-field py-1.5 text-sm flex-1"
                        autoFocus
                        min={min} max={max} step={step}
                      />
                      <button
                        type="button"
                        onClick={() => { setForm((prev) => ({ ...prev, [key]: editingValue })); setEditingField(null) }}
                        className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        title="Save"
                      >
                        <HiCheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                        title="Cancel"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 text-sm">{display}</p>
                      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
                    </>
                  )}
                </div>
                {isSuperAdmin && editingField !== key && (
                  <button
                    type="button"
                    onClick={() => { setEditingField(key); setEditingValue(form[key]) }}
                    className="ml-4 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <HiPencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-5">Platform Settings</h2>
          <div className="space-y-4">
            {[
              { key: 'platform_name', label: 'Platform Name', type: 'text' },
              { key: 'support_email', label: 'Support Email', type: 'email' },
            ].map(({ key, label, type }) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                  {editingField === key ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type={type}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        className="input-field py-1.5 text-sm flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, [key]: editingValue }))
                          setEditingField(null)
                        }}
                        className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                        title="Save"
                      >
                        <HiCheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingField(null)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
                        title="Cancel"
                      >
                        <HiX className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 text-sm truncate">{form[key]}</p>
                  )}
                </div>
                {isSuperAdmin && editingField !== key && (
                  <button
                    type="button"
                    onClick={() => { setEditingField(key); setEditingValue(form[key]) }}
                    className="ml-4 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <HiPencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gray-50">
          <div className="flex items-center gap-2 mb-4">
            <HiInformationCircle className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-700 text-sm">Current Configuration</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Interest Rate', value: `${form.interest_rate}%/mo` },
              { label: 'Tier 1 Max', value: formatNaira(Number(form.tier1_max_naira) * 100) },
              { label: 'Tier 2 Max', value: formatNaira(Number(form.tier2_max_naira) * 100) },
              { label: 'Tier 3 Max', value: formatNaira(Number(form.tier3_max_naira) * 100) },
              { label: 'Platform Name', value: form.platform_name },
              { label: 'Support Email', value: form.support_email },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="font-semibold text-gray-900 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex justify-end">
            <button type="submit" disabled={savingSettings} className="btn-primary flex items-center gap-2 px-6 py-2.5">
              {savingSettings
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <HiSave className="w-4 h-4" />}
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </form>

      {/* ── Loan Products Section ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Loan Products</h2>
          <p className="text-sm text-gray-500">Manage the loan products available to customers.</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 px-4 py-2">
            <HiPlus className="w-4 h-4" />
            New Product
          </button>
        )}
      </div>

      {loadingProducts ? (
        <LoadingSpinner />
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-3">No loan products yet.</p>
          {isSuperAdmin && (
            <button onClick={openCreateModal} className="btn-primary px-4 py-2 text-sm">
              Create your first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.id} className={`card relative ${!p.is_active ? 'opacity-60' : ''}`}>
              {/* Active badge */}
              <span className={`absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full border
                ${p.is_active
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                {p.is_active ? 'Active' : 'Inactive'}
              </span>

              <h3 className="font-bold text-gray-900 text-base mb-1 pr-20">{p.name}</h3>
              {p.description && <p className="text-sm text-gray-500 mb-3">{p.description}</p>}

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
                <div>
                  <span className="text-xs text-gray-400 block">Min Amount</span>
                  <span className="font-medium text-gray-800">{formatNaira(p.min_amount)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Max Amount</span>
                  <span className="font-medium text-gray-800">{formatNaira(p.max_amount)}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Min Tenor</span>
                  <span className="font-medium text-gray-800">{p.min_tenor_months} month{p.min_tenor_months !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Max Tenor</span>
                  <span className="font-medium text-gray-800">{p.max_tenor_months} month{p.max_tenor_months !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(p)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <HiPencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors
                      ${p.is_active
                        ? 'border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                        : 'border-green-200 text-green-700 hover:bg-green-50'}`}
                  >
                    {p.is_active ? <><HiXCircle className="w-3.5 h-3.5" /> Deactivate</> : <><HiCheckCircle className="w-3.5 h-3.5" /> Activate</>}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(p)}
                    disabled={deletingId === p.id}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors ml-auto disabled:opacity-50"
                  >
                    <HiTrash className="w-3.5 h-3.5" />
                    {deletingId === p.id ? '...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Product Modal ── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {editingProduct ? `Editing "${editingProduct.name}"` : 'Add a new loan product for customers to apply for.'}
            </p>

            {productError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {productError}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="form-label">Product Name</label>
                <input
                  type="text" name="name" value={productForm.name}
                  onChange={handleProductFormChange} className="input-field"
                  placeholder="e.g. Quick Loan, Business Loan"
                />
              </div>
              <div>
                <label className="form-label">Description <span className="text-gray-400">(optional)</span></label>
                <textarea
                  name="description" value={productForm.description}
                  onChange={handleProductFormChange} className="input-field resize-none"
                  rows={2} placeholder="Brief description of this product..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Min Amount (₦)</label>
                  <input
                    type="number" name="min_amount_naira" value={productForm.min_amount_naira}
                    onChange={handleProductFormChange} className="input-field"
                    placeholder="10000" min={1}
                  />
                </div>
                <div>
                  <label className="form-label">Max Amount (₦)</label>
                  <input
                    type="number" name="max_amount_naira" value={productForm.max_amount_naira}
                    onChange={handleProductFormChange} className="input-field"
                    placeholder="500000" min={1}
                  />
                </div>
                <div>
                  <label className="form-label">Min Tenor (months)</label>
                  <input
                    type="number" name="min_tenor_months" value={productForm.min_tenor_months}
                    onChange={handleProductFormChange} className="input-field"
                    placeholder="1" min={1}
                  />
                </div>
                <div>
                  <label className="form-label">Max Tenor (months)</label>
                  <input
                    type="number" name="max_tenor_months" value={productForm.max_tenor_months}
                    onChange={handleProductFormChange} className="input-field"
                    placeholder="12" min={1}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={savingProduct} className="btn-primary px-5 py-2 text-sm flex items-center gap-2">
                  {savingProduct
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <HiSave className="w-4 h-4" />}
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
