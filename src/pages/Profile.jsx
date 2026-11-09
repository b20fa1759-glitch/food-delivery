import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, profile } = useAuth()

  return (
    <div className="max-w-md bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">My profile</h1>
      <dl className="space-y-3">
        <div><dt className="text-sm text-gray-500">Name</dt><dd className="font-medium">{profile.full_name}</dd></div>
        <div><dt className="text-sm text-gray-500">Email</dt><dd className="font-medium">{user.email}</dd></div>
        <div><dt className="text-sm text-gray-500">Phone</dt><dd className="font-medium">{profile.phone || '—'}</dd></div>
        <div><dt className="text-sm text-gray-500">Role</dt><dd className="font-medium capitalize">{profile.role}</dd></div>
      </dl>
    </div>
  )
}
