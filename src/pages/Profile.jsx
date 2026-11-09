import { useAuth } from '../context/AuthContext'

const ROLE_LABELS = { admin: 'Админ', customer: 'Хэрэглэгч' }

export default function Profile() {
  const { user, profile } = useAuth()

  return (
    <div className="max-w-md bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Миний профайл</h1>
      <dl className="space-y-3">
        <div><dt className="text-sm text-gray-500">Нэр</dt><dd className="font-medium">{profile.full_name}</dd></div>
        <div><dt className="text-sm text-gray-500">Имэйл</dt><dd className="font-medium">{user.email}</dd></div>
        <div><dt className="text-sm text-gray-500">Утас</dt><dd className="font-medium">{profile.phone || '—'}</dd></div>
        <div><dt className="text-sm text-gray-500">Эрх</dt><dd className="font-medium">{ROLE_LABELS[profile.role] ?? profile.role}</dd></div>
      </dl>
    </div>
  )
}
