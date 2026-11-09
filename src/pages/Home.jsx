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
        .select('id, name, description, delivery_fee, is_open')
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
        <h1 className="text-3xl md:text-4xl font-bold">Hungry? Order in minutes.</h1>
        <p className="mt-2 text-brand-100">Ulaanbaatar's favourite restaurants, delivered to your door.</p>
        <Link to="/menu" className="inline-block mt-4 bg-white text-brand-700 font-semibold px-5 py-2 rounded-lg">
          Browse menu
        </Link>
      </section>

      <h2 className="text-2xl font-bold mb-4">Restaurants</h2>

      {loading && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((r) => (
          <Link key={r.id} to={`/restaurants/${r.id}`}
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-5">
            <h3 className="font-semibold text-lg">{r.name}</h3>
            <p className="text-gray-500 text-sm mt-1">{r.description}</p>
            <p className={`text-sm mt-3 ${r.is_open ? 'text-green-600' : 'text-red-500'}`}>
              {r.is_open ? 'Open now' : 'Closed'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
