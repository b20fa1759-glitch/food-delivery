import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import FormField from '../../components/FormField'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB, same limit as the storage bucket
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500'

// item = null → "Add" mode, item = object → "Edit" mode
export default function MenuItemForm({ item, restaurants, categories, onClose, onSaved }) {
  const isEdit = Boolean(item)

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? '',
    restaurant_id: item?.restaurant_id ?? '',
    is_available: item?.is_available ?? true,
  })
  // Selected category ids (N:M table menu_item_categories)
  const [categoryIds, setCategoryIds] = useState(
    item?.menu_item_categories.map((c) => c.category_id) ?? []
  )
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(item?.image_url ?? null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  function toggleCategory(id) {
    setCategoryIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  // Check the file BEFORE uploading, then show a preview
  function handleFile(e) {
    const selected = e.target.files[0]
    if (!selected) return
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Only JPG, PNG or WEBP images are allowed')
      e.target.value = ''
      return
    }
    if (selected.size > MAX_SIZE) {
      toast.error('Image must be smaller than 2 MB')
      e.target.value = ''
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected)) // temporary local URL for the preview
  }

  function validate() {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Name is required'
    const price = Number(form.price)
    if (!Number.isInteger(price) || price <= 0) e.price = 'Price must be a whole number above 0'
    if (!form.restaurant_id) e.restaurant_id = 'Please choose a restaurant'
    if (categoryIds.length === 0) e.categories = 'Choose at least one category'
    return e
  }

  async function uploadImage() {
    const ext = file.name.split('.').pop()
    const path = `menu/${crypto.randomUUID()}.${ext}` // random name so files never clash
    const { error } = await supabase.storage.from('food-images').upload(path, file)
    if (error) throw error
    return supabase.storage.from('food-images').getPublicUrl(path).data.publicUrl
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    try {
      const image_url = file ? await uploadImage() : (item?.image_url ?? null)
      const row = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        restaurant_id: Number(form.restaurant_id),
        is_available: form.is_available,
        image_url,
      }

      // 1. Save the dish (UPDATE or INSERT)
      let itemId = item?.id
      if (isEdit) {
        const { error } = await supabase.from('menu_items').update(row).eq('id', itemId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('menu_items').insert(row).select('id').single()
        if (error) throw error
        itemId = data.id
      }

      // 2. Save categories (N:M): remove old links, insert the new ones
      const { error: deleteError } = await supabase
        .from('menu_item_categories')
        .delete()
        .eq('menu_item_id', itemId)
      if (deleteError) throw deleteError

      const links = categoryIds.map((category_id) => ({ menu_item_id: itemId, category_id }))
      const { error: linkError } = await supabase.from('menu_item_categories').insert(links)
      if (linkError) throw linkError

      toast.success(isEdit ? 'Dish updated' : 'Dish added')
      onSaved()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        noValidate
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
      >
        <h2 className="text-xl font-bold">{isEdit ? 'Edit dish' : 'Add new dish'}</h2>

        <FormField label="Name" name="name" value={form.name} onChange={handleChange} error={errors.name} />

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Description</span>
          <textarea name="description" rows="2" value={form.description} onChange={handleChange} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Price (₮)" name="price" type="number" value={form.price} onChange={handleChange} error={errors.price} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Restaurant</span>
            <select name="restaurant_id" value={form.restaurant_id} onChange={handleChange} className={inputClass}>
              <option value="">Choose…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errors.restaurant_id && <span className="text-sm text-red-600">{errors.restaurant_id}</span>}
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">Categories</span>
          <div className="mt-1 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  categoryIds.includes(c.id)
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          {errors.categories && <span className="text-sm text-red-600">{errors.categories}</span>}
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">Image (JPG, PNG, WEBP · max 2 MB)</span>
          <div className="mt-1 flex items-center gap-4">
            <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 text-sm">
              {preview ? <img src={preview} alt="Preview" className="w-full h-full object-cover" /> : 'No image'}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="w-4 h-4 accent-brand-600" />
          <span>Available to order</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
