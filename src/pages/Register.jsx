import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import FormField from '../components/FormField'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Бүх input-д нэг handler: input-ийн "name"-ээр зөв талбарыг шинэчилнэ
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    const e = {}
    if (form.fullName.trim().length < 2) e.fullName = 'Нэрээ оруулна уу'
    if (!/^\d{8}$/.test(form.phone)) e.phone = 'Утасны дугаар 8 оронтой байх ёстой'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Зөв имэйл хаяг оруулна уу'
    if (form.password.length < 6) e.password = 'Нууц үг дор хаяж 6 тэмдэгт байна'
    if (form.confirm !== form.password) e.confirm = 'Нууц үг таарахгүй байна'
    return e
  }

  async function handleSubmit(event) {
    event.preventDefault() // хөтөч хуудсыг дахин ачаалахаас сэргийлнэ
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      // Энэ өгөгдөл raw_user_meta_data-д очно → trigger нь profiles руу хуулна
      options: { data: { full_name: form.fullName.trim(), phone: form.phone } },
    })
    setSubmitting(false)

    if (error) {
      toast.error(
        error.message.includes('already registered')
          ? 'Энэ имэйлээр бүртгэл үүссэн байна'
          : 'Бүртгэл үүсгэж чадсангүй. Дахин оролдоно уу.'
      )
      return
    }
    toast.success('Бүртгэл амжилттай үүслээ! 🎉')
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Бүртгүүлэх</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Овог нэр" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
        <FormField label="Утас" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="99112233" />
        <FormField label="Имэйл" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Нууц үг" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Нууц үг давтах" name="confirm" type="password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Бүртгэл үүсгэж байна…' : 'Бүртгүүлэх'}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-600">
        Бүртгэлтэй юу? <Link to="/login" className="text-brand-600 font-semibold">Нэвтрэх</Link>
      </p>
    </div>
  )
}
