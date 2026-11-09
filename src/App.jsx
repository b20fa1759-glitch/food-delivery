import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [restaurants, setRestaurants] = useState([])
  const [error, setError] = useState(null)

  // Runs once when the page opens
  useEffect(() => {
    async function loadRestaurants() {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, description')
        .order('id')

      if (error) setError(error.message)
      else setRestaurants(data)
    }
    loadRestaurants()
  }, [])

  return (
    <div className="min-h-screen bg-orange-50 p-8">
      <h1 className="text-3xl font-bold text-orange-600 mb-6">FoodGo 🍔 Restaurants</h1>

      {error && <p className="text-red-600">Error: {error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {restaurants.map((r) => (
          <div key={r.id} className="bg-white rounded-xl shadow p-4">
            <h2 className="font-semibold text-lg">{r.name}</h2>
            <p className="text-gray-500">{r.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
