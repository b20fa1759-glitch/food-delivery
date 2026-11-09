import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import FormField from '../components/FormField'

export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = {}
    if (form.password.length < 6) found.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) found.confirm = 'Passwords do not match'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    // The email link logged the user in temporarily, so we can change the password
    const { error } = await supabase.auth.updateUser({ password: form.password })
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Password changed!')
    navigate('/profile')
  }

  if (loading) return <p className="text-gray-500">Loading…</p>

  // Opened without a valid email link (or the link expired)
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold">Link is invalid or expired</h1>
        <Link to="/forgot-password" className="inline-block mt-4 text-orange-600 font-semibold">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Set a new password</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="New password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Confirm new password" name="confirm" type="password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-orange-600 text-white font-semibold py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </div>
  )
}
