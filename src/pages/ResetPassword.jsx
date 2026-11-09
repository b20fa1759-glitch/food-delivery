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
    if (form.password.length < 6) found.password = 'Нууц үг дор хаяж 6 тэмдэгт байна'
    if (form.confirm !== form.password) found.confirm = 'Нууц үг таарахгүй байна'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    // Имэйлийн холбоос хэрэглэгчийг түр нэвтрүүлсэн тул нууц үгийг сольж болно
    const { error } = await supabase.auth.updateUser({ password: form.password })
    setSaving(false)
    if (error) {
      toast.error('Нууц үг сольж чадсангүй. Дахин оролдоно уу.')
      return
    }
    toast.success('Нууц үг амжилттай солигдлоо!')
    navigate('/profile')
  }

  if (loading) return <p className="text-gray-500">Ачаалж байна…</p>

  // Хүчинтэй холбоосгүйгээр нээсэн (эсвэл хугацаа нь дууссан)
  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-xl font-bold">Холбоос хүчингүй эсвэл хугацаа нь дууссан байна</h1>
        <Link to="/forgot-password" className="inline-block mt-4 text-brand-600 font-semibold">
          Шинэ холбоос авах
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Шинэ нууц үг тохируулах</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Шинэ нууц үг" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Шинэ нууц үг давтах" name="confirm" type="password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Хадгалж байна…' : 'Шинэ нууц үг хадгалах'}
        </button>
      </form>
    </div>
  )
}
