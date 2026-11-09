import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg font-medium ${
    isActive ? 'bg-brand-100 text-brand-700' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    toast.success('Системээс гарлаа')
    navigate('/')
  }

  // Холбоосууд нь хэн нэвтэрснээс хамаарна
  const links = [
    { to: '/', label: 'Нүүр' },
    { to: '/menu', label: 'Цэс' },
    ...(user ? [{ to: '/profile', label: 'Профайл' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Админ' }] : []),
  ]

  const authButtons = user ? (
    <>
      <span className="px-3 text-sm text-gray-500">Сайн уу, {profile?.full_name || 'та'}</span>
      <button onClick={handleLogout} className="px-4 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-100">
        Гарах
      </button>
    </>
  ) : (
    <>
      <NavLink to="/login" className={linkClass}>Нэвтрэх</NavLink>
      <Link to="/register" className="px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700">
        Бүртгүүлэх
      </Link>
    </>
  )

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-brand-600">FoodGo 🍔</Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass}>{l.label}</NavLink>
          ))}
          <div className="ml-2 flex items-center gap-1">{authButtons}</div>
        </div>

        <button className="md:hidden p-2 text-2xl" onClick={() => setOpen(!open)} aria-label="Цэс нээх, хаах">
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t px-4 py-2 flex flex-col gap-1" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass}>{l.label}</NavLink>
          ))}
          {authButtons}
        </div>
      )}
    </header>
  )
}
