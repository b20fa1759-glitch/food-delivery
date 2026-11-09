import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// <ProtectedRoute />           → зөвхөн нэвтэрсэн хэрэглэгч
// <ProtectedRoute adminOnly /> → зөвхөн админ
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Ачаалж байна…</p>

  if (!user) {
    // Хаашаа орох гэж байсныг санаж, нэвтэрсний дараа буцааж илгээнэ
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (adminOnly && !isAdmin) return <Navigate to="/" replace />

  return <Outlet />
}
