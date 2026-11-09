import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-6xl">🍽️</p>
      <h1 className="text-3xl font-bold mt-4">404 — Хуудас олдсонгүй</h1>
      <Link to="/" className="inline-block mt-6 text-brand-600 font-semibold">← Нүүр хуудас руу буцах</Link>
    </div>
  )
}
