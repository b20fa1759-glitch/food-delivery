import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import FormField from '../../components/FormField'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB, storage bucket-ийн хязгаартай ижил
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500'

// item = null → "Нэмэх" горим, item = объект → "Засах" горим
export default function MenuItemForm({ item, restaurants, categories, onClose, onSaved }) {
  const isEdit = Boolean(item)

  const [form, setForm] = useState({
    name: item?.name ?? '',
    description: item?.description ?? '',
    price: item?.price ?? '',
    restaurant_id: item?.restaurant_id ?? '',
    is_available: item?.is_available ?? true,
  })
  // Сонгосон ангиллын id-ууд (N:M хүснэгт menu_item_categories)
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

  // Файлыг оруулахаас ӨМНӨ шалгаж, урьдчилан харуулна
  function handleFile(e) {
    const selected = e.target.files[0]
    if (!selected) return
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Зөвхөн JPG, PNG, WEBP зураг оруулна')
      e.target.value = ''
      return
    }
    if (selected.size > MAX_SIZE) {
      toast.error('Зураг 2 MB-аас бага байх ёстой')
      e.target.value = ''
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected)) // урьдчилан харах түр холбоос
  }

  function validate() {
    const e = {}
    if (form.name.trim().length < 2) e.name = 'Хоолны нэр оруулна уу'
    const price = Number(form.price)
    if (!Number.isInteger(price) || price <= 0) e.price = 'Үнэ 0-ээс их бүхэл тоо байна'
    if (!form.restaurant_id) e.restaurant_id = 'Ресторан сонгоно уу'
    if (categoryIds.length === 0) e.categories = 'Дор хаяж нэг ангилал сонгоно уу'
    return e
  }

  async function uploadImage() {
    const ext = file.name.split('.').pop()
    const path = `menu/${crypto.randomUUID()}.${ext}` // санамсаргүй нэр, давхцахгүй
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

      // 1. Хоолыг хадгална (UPDATE эсвэл INSERT)
      let itemId = item?.id
      if (isEdit) {
        const { error } = await supabase.from('menu_items').update(row).eq('id', itemId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('menu_items').insert(row).select('id').single()
        if (error) throw error
        itemId = data.id
      }

      // 2. Ангиллыг хадгална (N:M): хуучин холбоосыг устгаад шинийг нэмнэ
      const { error: deleteError } = await supabase
        .from('menu_item_categories')
        .delete()
        .eq('menu_item_id', itemId)
      if (deleteError) throw deleteError

      const links = categoryIds.map((category_id) => ({ menu_item_id: itemId, category_id }))
      const { error: linkError } = await supabase.from('menu_item_categories').insert(links)
      if (linkError) throw linkError

      toast.success(isEdit ? 'Хоол шинэчлэгдлээ' : 'Хоол нэмэгдлээ')
      onSaved()
    } catch (err) {
      toast.error('Хадгалж чадсангүй: ' + err.message)
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
        <h2 className="text-xl font-bold">{isEdit ? 'Хоол засах' : 'Шинэ хоол нэмэх'}</h2>

        <FormField label="Нэр" name="name" value={form.name} onChange={handleChange} error={errors.name} />

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Тайлбар</span>
          <textarea name="description" rows="2" value={form.description} onChange={handleChange} className={inputClass} />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Үнэ (₮)" name="price" type="number" value={form.price} onChange={handleChange} error={errors.price} />
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Ресторан</span>
            <select name="restaurant_id" value={form.restaurant_id} onChange={handleChange} className={inputClass}>
              <option value="">Сонгох…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            {errors.restaurant_id && <span className="text-sm text-red-600">{errors.restaurant_id}</span>}
          </label>
        </div>

        <div>
          <span className="text-sm font-medium text-gray-700">Ангилал</span>
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
          <span className="text-sm font-medium text-gray-700">Зураг (JPG, PNG, WEBP · ихдээ 2 MB)</span>
          <div className="mt-1 flex items-center gap-4">
            <div className="w-24 h-24 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center text-gray-400 text-sm">
              {preview ? <img src={preview} alt="Урьдчилан харах" className="w-full h-full object-cover" /> : 'Зураггүй'}
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="text-sm" />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_available" checked={form.is_available} onChange={handleChange} className="w-4 h-4 accent-brand-600" />
          <span>Захиалах боломжтой</span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100">
            Болих
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Хадгалж байна…' : 'Хадгалах'}
          </button>
        </div>
      </form>
    </div>
  )
}
