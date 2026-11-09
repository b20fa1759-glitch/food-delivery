import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home' },
  { to: '/menu', label: 'Menu' },
  { to: '/login', label: 'Login' },
]

// NavLink gives us isActive, so the current page is highlighted
const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg font-medium ${
    isActive ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-100'
  }`

export default function Navbar() {
  const [open, setOpen] = useState(false) // mobile menu open or closed

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-orange-600">FoodGo 🍔</Link>

        {/* Desktop links: hidden on phones, shown from md (768px) */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass}>{l.label}</NavLink>
          ))}
          <Link to="/register" className="ml-2 px-4 py-2 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700">
            Sign up
          </Link>
        </div>

        {/* Phone menu button */}
        <button className="md:hidden p-2 text-2xl" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Phone menu */}
      {open && (
        <div className="md:hidden border-t px-4 py-2 flex flex-col gap-1" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={linkClass}>{l.label}</NavLink>
          ))}
          <NavLink to="/register" className={linkClass}>Sign up</NavLink>
        </div>
      )}
    </header>
  )
}
