import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import FormField from '../components/FormField'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Зөв имэйл хаяг оруулна уу')
      return
    }
    setError('')
    setSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Имэйл дэх холбоос манай аппын энэ хуудсыг нээнэ
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSending(false)
    if (error) {
      toast.error('Холбоос илгээж чадсангүй. Түр хүлээгээд дахин оролдоно уу.')
      return
    }
    setSent(true)
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm p-8">
      <h1 className="text-2xl font-bold mb-2">Нууц үг сэргээх</h1>

      {sent ? (
        <p className="text-gray-600">
          Хэрэв <b>{email}</b> хаягаар бүртгэл байгаа бол нууц үг сэргээх холбоос илгээлээ. Имэйлээ шалгана уу.
        </p>
      ) : (
        <>
          <p className="text-gray-500 mb-6">Имэйлээ оруулбал нууц үг сэргээх холбоос илгээнэ.</p>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormField label="Имэйл" type="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? 'Илгээж байна…' : 'Холбоос илгээх'}
            </button>
          </form>
        </>
      )}

      <p className="text-sm text-center mt-4">
        <Link to="/login" className="text-brand-600 font-semibold">← Нэвтрэх хуудас руу буцах</Link>
      </p>
    </div>
  )
}
