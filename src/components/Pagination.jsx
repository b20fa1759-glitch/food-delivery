// Shows ← Prev | Page 1 of 3 | Next →   (hidden when there is only one page)
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const buttonClass = 'px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40'

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={buttonClass}>
        ← Prev
      </button>
      <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={buttonClass}>
        Next →
      </button>
    </div>
  )
}
