import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import FormField from '../components/FormField'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const found = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Зөв имэйл хаяг оруулна уу'
    if (!form.password) found.password = 'Нууц үгээ оруулна уу'
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    setSubmitting(false)

    if (error) {
      toast.error('Имэйл эсвэл нууц үг буруу байна')
      return
    }
    toast.success('Тавтай морил!')
    // ProtectedRoute энд илгээсэн бол тэр хуудас руу, үгүй бол нүүр хуудас руу
    navigate(location.state?.from || '/', { replace: true })
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Нэвтрэх</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Имэйл" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Нууц үг" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-sm text-brand-600">Нууц үгээ мартсан уу?</Link>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Нэвтэрч байна…' : 'Нэвтрэх'}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-600">
        Бүртгэлгүй юу? <Link to="/register" className="text-brand-600 font-semibold">Бүртгүүлэх</Link>
      </p>
    </div>
  )
}
