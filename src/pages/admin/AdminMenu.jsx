import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/supabase'
import { formatPrice } from '../../utils/format'
import ConfirmDialog from '../../components/ConfirmDialog'
import MenuItemForm from './MenuItemForm'

// Load dishes (with restaurant name + category links), restaurants and categories at the same time
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
  const [reloadKey, setReloadKey] = useState(0) // change it to load the data again
  const [editing, setEditing] = useState(null) // null = form closed, 'new' = add, object = edit
  const [deleting, setDeleting] = useState(null) // the dish waiting for delete confirmation
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchAll().then((result) => {
      if (result.error) toast.error(result.error.message)
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
      toast.error(error.message)
      return
    }
    toast.success('Dish deleted')
    setDeleting(null)
    reload()
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <Link to="/admin" className="text-sm text-brand-600">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Menu items</h1>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="bg-brand-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-brand-700"
        >
          + Add dish
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}

      {!loading && items.length === 0 && (
        <p className="text-center text-gray-500 py-12 bg-white rounded-xl">
          No dishes yet. Click “Add dish” to create one.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3">Dish</th>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Price</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
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
                      {item.is_available ? 'Available' : 'Hidden'}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(item)} className="px-3 py-1 rounded-lg text-brand-700 hover:bg-brand-50">
                      Edit
                    </button>
                    <button onClick={() => setDeleting(item)} className="px-3 py-1 rounded-lg text-red-600 hover:bg-red-50">
                      Delete
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
        title="Delete dish?"
        message={`“${deleting?.name}” will be removed permanently.`}
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
