// Props: label, error, and any normal <input> props (name, type, value, onChange...)
export default function FormField({ label, error, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        {...inputProps}
        className={`mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  )
}