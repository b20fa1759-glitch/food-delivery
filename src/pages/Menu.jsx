import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import FoodCard from '../components/FoodCard'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 8

const SORTS = {
  newest: { column: 'created_at', ascending: false },
  price_asc: { column: 'price', ascending: true },
  price_desc: { column: 'price', ascending: false },
  name: { column: 'name', ascending: true },
}

// Builds ONE database query from all the filters
async function fetchMenu({ query, categoryId, minPrice, maxPrice, sort, page }) {
  let request = supabase
    .from('menu_items')
    .select(
      'id, name, description, price, image_url, created_at, restaurants(name), menu_item_categories!inner(category_id)',
      { count: 'exact' } // also return the total number of matches (for pagination)
    )
    .eq('is_available', true)

  if (query) request = request.ilike('name', `%${query}%`) // name contains the text, ignoring case
  if (categoryId) request = request.eq('menu_item_categories.category_id', categoryId) // N:M filter
  if (minPrice) request = request.gte('price', Number(minPrice))
  if (maxPrice) request = request.lte('price', Number(maxPrice))

  const { column, ascending } = SORTS[sort]
  request = request.order(column, { ascending }).order('id')

  const from = (page - 1) * PAGE_SIZE
  request = request.range(from, from + PAGE_SIZE - 1) // e.g. page 2 → rows 8..15

  const { data, count, error } = await request
  return { items: data ?? [], count: count ?? 0, error }
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500'

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('') // what the user is typing
  const [query, setQuery] = useState('') // what we actually search for (after a short pause)
  const [categoryId, setCategoryId] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ key: null, items: [], count: 0, error: null })

  // Load the category list once
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Debounce: wait 400 ms after the user stops typing, then search
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // All filters in one string: when any filter changes, the data loads again
  const queryKey = JSON.stringify({ query, categoryId, minPrice, maxPrice, sort, page })

  useEffect(() => {
    let ignore = false
    fetchMenu(JSON.parse(queryKey)).then((r) => {
      if (!ignore) setResult({ key: queryKey, ...r })
    })
    return () => {
      ignore = true
    }
  }, [queryKey])

  const loading = result.key !== queryKey
  const totalPages = Math.max(1, Math.ceil(result.count / PAGE_SIZE))

  // Changing any filter goes back to page 1
  function updateFilter(setter) {
    return (e) => {
      setter(e.target.value)
      setPage(1)
    }
  }

  function clearFilters() {
    setSearch('')
    setQuery('')
    setCategoryId('')
    setMinPrice('')
    setMaxPrice('')
    setSort('newest')
    setPage(1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Menu</h1>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          placeholder="Search dishes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} lg:col-span-2`}
        />
        <select value={categoryId} onChange={updateFilter(setCategoryId)} className={inputClass}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="number" min="0" placeholder="Min ₮" value={minPrice} onChange={updateFilter(setMinPrice)} className={inputClass} />
          <input type="number" min="0" placeholder="Max ₮" value={maxPrice} onChange={updateFilter(setMaxPrice)} className={inputClass} />
        </div>
        <select value={sort} onChange={updateFilter(setSort)} className={inputClass}>
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      {/* Error state */}
      {!loading && result.error && (
        <p className="text-red-600 mb-4">Could not load the menu: {result.error.message}</p>
      )}

      {/* Loading state: grey placeholder cards */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !result.error && result.items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-semibold">No dishes found</p>
          <p className="text-gray-500 text-sm">Try another name, category or price range.</p>
          <button onClick={clearFilters} className="mt-4 text-brand-600 font-semibold">Clear filters</button>
        </div>
      )}

      {/* Results */}
      {!loading && result.items.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">{result.count} dishes found</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {result.items.map((item) => (
              <FoodCard key={item.id} item={item} showRestaurant />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  )
}