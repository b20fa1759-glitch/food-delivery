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

// Бүх шүүлтүүрээс НЭГ хүсэлт бүтээнэ
async function fetchMenu({ query, categoryId, minPrice, maxPrice, sort, page }) {
  let request = supabase
    .from('menu_items')
    .select(
      'id, name, description, price, image_url, created_at, restaurants(name), menu_item_categories!inner(category_id)',
      { count: 'exact' } // хуудаслалтад зориулж нийт тоог мөн буцаана
    )
    .eq('is_available', true)

  if (query) request = request.ilike('name', `%${query}%`) // нэр нь текстийг агуулж байгаа эсэх (том жижиг үсэг хамаарахгүй)
  if (categoryId) request = request.eq('menu_item_categories.category_id', categoryId) // N:M шүүлт
  if (minPrice) request = request.gte('price', Number(minPrice))
  if (maxPrice) request = request.lte('price', Number(maxPrice))

  const { column, ascending } = SORTS[sort]
  request = request.order(column, { ascending }).order('id')

  const from = (page - 1) * PAGE_SIZE
  request = request.range(from, from + PAGE_SIZE - 1) // ж: 2-р хуудас → 8..15-р мөр

  const { data, count, error } = await request
  return { items: data ?? [], count: count ?? 0, error }
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500'

export default function Menu() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('') // хэрэглэгчийн бичиж буй текст
  const [query, setQuery] = useState('') // богино хүлээлтийн дараа хайх текст
  const [categoryId, setCategoryId] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState({ key: null, items: [], count: 0, error: null })

  // Ангиллын жагсаалтыг нэг удаа ачаална
  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name')
      .order('sort_order')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  // Debounce: бичиж дууссанаас хойш 400 мс хүлээгээд хайна
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Бүх шүүлтүүр нэг мөрөнд: аль нэг нь өөрчлөгдөхөд өгөгдөл дахин ачаалагдана
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

  // Шүүлтүүр өөрчлөгдөхөд 1-р хуудас руу буцна
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
      <h1 className="text-2xl font-bold mb-4">Цэс</h1>

      {/* Шүүлтүүрийн мөр */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          type="search"
          placeholder="Хоол хайх…"
          aria-label="Хоол хайх"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} lg:col-span-2`}
        />
        <select value={categoryId} onChange={updateFilter(setCategoryId)} className={inputClass} aria-label="Ангилал">
          <option value="">Бүх ангилал</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="number" min="0" placeholder="Доод ₮" aria-label="Доод үнэ" value={minPrice} onChange={updateFilter(setMinPrice)} className={inputClass} />
          <input type="number" min="0" placeholder="Дээд ₮" aria-label="Дээд үнэ" value={maxPrice} onChange={updateFilter(setMaxPrice)} className={inputClass} />
        </div>
        <select value={sort} onChange={updateFilter(setSort)} className={inputClass} aria-label="Эрэмбэ">
          <option value="newest">Шинэ нь эхэндээ</option>
          <option value="price_asc">Үнэ: багаас их</option>
          <option value="price_desc">Үнэ: ихээс бага</option>
          <option value="name">Нэрээр (А–Я)</option>
        </select>
      </div>

      {/* Алдааны төлөв */}
      {!loading && result.error && (
        <p className="text-red-600 mb-4">Цэсийг ачаалж чадсангүй: {result.error.message}</p>
      )}

      {/* Ачаалж буй төлөв: саарал хоосон картууд */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-xl shadow-sm animate-pulse" />
          ))}
        </div>
      )}

      {/* Хоосон төлөв */}
      {!loading && !result.error && result.items.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl">
          <p className="text-4xl">🔍</p>
          <p className="mt-2 font-semibold">Хоол олдсонгүй</p>
          <p className="text-gray-500 text-sm">Өөр нэр, ангилал эсвэл үнийн хязгаар оролдоно уу.</p>
          <button onClick={clearFilters} className="mt-4 text-brand-600 font-semibold">Шүүлтүүрийг арилгах</button>
        </div>
      )}

      {/* Илэрц */}
      {!loading && result.items.length > 0 && (
        <>
          <p className="text-sm text-gray-500 mb-3">{result.count} хоол олдлоо</p>
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
