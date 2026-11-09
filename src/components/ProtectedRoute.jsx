import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// <ProtectedRoute />           → only logged-in users
// <ProtectedRoute adminOnly /> → only admins
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Loading…</p>

  if (!user) {
    // Remember where they wanted to go, so Login can send them back
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
