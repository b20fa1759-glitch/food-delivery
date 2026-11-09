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

  // One handler for all inputs: uses the input's "name" to update the right field
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function validate() {
    const e = {}
    if (form.fullName.trim().length < 2) e.fullName = 'Please enter your name'
    if (!/^\d{8}$/.test(form.phone)) e.phone = 'Phone number must be 8 digits'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    return e
  }

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      // This data goes to raw_user_meta_data → our trigger copies it into profiles
      options: { data: { full_name: form.fullName.trim(), phone: form.phone } },
    })
    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Account created! Welcome 🎉')
    navigate('/')
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-6">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Full name" name="fullName" value={form.fullName} onChange={handleChange} error={errors.fullName} />
        <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="99112233" />
        <FormField label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
        <FormField label="Password" name="password" type="password" value={form.password} onChange={handleChange} error={errors.password} />
        <FormField label="Confirm password" name="confirm" type="password" value={form.confirm} onChange={handleChange} error={errors.confirm} />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-orange-600 text-white font-semibold py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="text-sm text-center mt-4 text-gray-600">
        Already have an account? <Link to="/login" className="text-orange-600 font-semibold">Log in</Link>
      </p>
    </div>
  )
}