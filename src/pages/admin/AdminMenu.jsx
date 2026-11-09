import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../utils/format'
import ConfirmDialog from '../../components/ConfirmDialog'
import MenuItemForm from './MenuItemForm'

// Хоол (ресторан нэр, ангиллын холбоостой), ресторан, ангиллыг зэрэг ачаална
async function fetchAll() {
  const [items, restaurants, categories] = await Promise.all([
    supabase
      .from('menu_items')
      .select('id, name, description, price, image_url, is_available, restaurant_id, restaurants(name), menu_item_categories(category_id)')
      .order('id'),
    supabase.from('restaurants').select('id, name').order('name'),
    supabase.from('categories').select('id, name').order('sort_order'),
  ])
  return {
    items: items.data ?? [],
    restaurants: restaurants.data ?? [],
    categories: categories.data ?? [],
    error: items.error || restaurants.error || categories.error,
  }
}

export default function AdminMenu() {
  const [items, setItems] = useState([])
  const [restaurants, setRestaurants] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0) // өөрчилбөл өгөгдлийг дахин ачаална
  const [editing, setEditing] = useState(null) // null = форм хаалттай, 'new' = нэмэх, объект = засах
  const [deleting, setDeleting] = useState(null) // устгахыг баталгаажуулах хоол
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchAll().then((result) => {
      if (result.error) toast.error('Өгөгдөл ачаалж чадсангүй: ' + result.error.message)
      setItems(result.items)
      setRestaurants(result.restaurants)
      setCategories(result.categories)
      setLoading(false)
    })
  }, [reloadKey])

  const reload = () => setReloadKey((k) => k + 1)

  async function handleDelete() {
    setDeleteLoading(true)
    const { error } = await supabase.from('menu_items').delete().eq('id', deleting.id)
    setDeleteLoading(false)
    if (error) {
      toast.error('Устгаж чадсангүй: ' + error.message)
      return
    }
    toast.success('Хоол устгагдлаа')
    setDeleting(null)
    reload()
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-brand-600">← Самбар</Link>
          <h1 className="text-2xl font-bold">Хоолны цэс</h1>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          + Хоол нэмэх
        </button>
      </div>

      {loading && <p className="text-gray-500">Ачаалж байна…</p>}

      {!loading && items.length === 0 && (
        <p className="text-center text-gray-500 py-12 bg-white rounded-xl">
          Хоол алга байна. «Хоол нэмэх» дээр дарж үүсгэнэ үү.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">Хоол</th>
                <th className="p-3">Ресторан</th>
                <th className="p-3">Үнэ</th>
                <th className="p-3">Төлөв</th>
                <th className="p-3 text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-brand-100 flex items-center justify-center">🍽️</div>
                      )}
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-600">{item.restaurants?.name}</td>
                  <td className="p-3">{formatPrice(item.price)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.is_available ? 'Боломжтой' : 'Нуусан'}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(item)} className="px-3 py-1 rounded-lg text-brand-700 hover:bg-brand-50">
                      Засах
                    </button>
                    <button onClick={() => setDeleting(item)} className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50">
                      Устгах
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <MenuItemForm
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? null : editing}
          restaurants={restaurants}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Хоолыг устгах уу?"
        message={`«${deleting?.name}» бүр мөсөн устгагдана.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
