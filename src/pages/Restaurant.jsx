import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../utils/format'
import FoodCard from '../components/FoodCard'

export default function Restaurant() {
  const { id } = useParams() // URL-ийн /restaurants/:id хэсгээс
  const [result, setResult] = useState({ id: null, restaurant: null })

  useEffect(() => {
    let ignore = false // хэрэглэгч өөр ресторан хурдан нээвэл хуучин хариуг үл тооно
    supabase
      .from('restaurants')
      // Нэг хүсэлтээр: ресторан + бүх хоол (1:N холбоо)
      .select('id, name, description, address, delivery_fee, min_order, is_open, image_url, menu_items(id, name, description, price, image_url, is_available)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (!ignore) setResult({ id, restaurant: data })
      })
    return () => {
      ignore = true
    }
  }, [id])

  const loading = result.id !== id

  if (loading) return <p className="text-gray-500">Ачаалж байна…</p>

  if (!result.restaurant) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold">Ресторан олдсонгүй</h1>
        <Link to="/" className="inline-block mt-4 text-brand-600 font-semibold">← Ресторанууд руу буцах</Link>
      </div>
    )
  }

  const r = result.restaurant
  const dishes = r.menu_items.filter((item) => item.is_available)

  return (
    <div>
      <Link to="/" className="text-sm text-brand-600">← Бүх ресторан</Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-2 mb-8">
        {r.image_url && (
          <img src={r.image_url} alt={r.name} className="w-full h-56 object-cover rounded-xl mb-5" />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">{r.name}</h1>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            r.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {r.is_open ? 'Одоо нээлттэй' : 'Хаалттай'}
          </span>
        </div>
        <p className="text-gray-500 mt-1">{r.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-gray-600">
          <span>📍 {r.address}</span>
          <span>🚚 Хүргэлт {formatPrice(r.delivery_fee)}</span>
          <span>🧾 Доод захиалга {formatPrice(r.min_order)}</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Цэс ({dishes.length})</h2>

      {dishes.length === 0 ? (
        <p className="text-center text-gray-500 py-12 bg-white rounded-xl">Энэ ресторанд одоогоор хоол алга.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dishes.map((item) => (
            <FoodCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
