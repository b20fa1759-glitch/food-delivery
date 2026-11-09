import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, description, delivery_fee, is_open, image_url')
        .order('id')
      if (error) setError(error.message)
      else setRestaurants(data)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <section className="rounded-2xl bg-brand-600 text-white p-8 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold">Өлсөж байна уу? Хэдхэн минутад захиал.</h1>
        <p className="mt-2 text-brand-100">Улаанбаатарын дуртай ресторанууд таны үүдэнд.</p>
        <Link to="/menu" className="inline-block mt-4 bg-white text-brand-700 font-semibold px-5 py-2 rounded-lg">
          Цэс үзэх
        </Link>
      </section>

      <h2 className="text-2xl font-bold mb-4">Ресторанууд</h2>

      {loading && <p className="text-gray-500">Ачаалж байна…</p>}
      {error && <p className="text-red-600">Алдаа гарлаа: {error}</p>}
      {!loading && !error && restaurants.length === 0 && (
        <p className="text-gray-500">Ресторан одоогоор алга байна.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <Link key={r.id} to={`/restaurants/${r.id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
            {r.image_url ? (
              <img src={r.image_url} alt={r.name} className="h-44 w-full object-cover" />
            ) : (
              <div className="h-44 bg-brand-100 flex items-center justify-center text-4xl">🍽️</div>
            )}
            <div className="p-5">
              <h3 className="font-semibold text-lg">{r.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{r.description}</p>
              <p className={`text-sm mt-3 ${r.is_open ? 'text-green-600' : 'text-red-500'}`}>
                {r.is_open ? 'Одоо нээлттэй' : 'Хаалттай'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
