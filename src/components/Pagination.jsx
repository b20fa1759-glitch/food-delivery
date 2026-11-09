// ← Өмнөх | Хуудас 1 / 3 | Дараах →   (ганц хуудастай бол харагдахгүй)
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const buttonClass = 'px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40'

  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button onClick={() => onChange(page - 1)} disabled={page === 1} className={buttonClass}>
        ← Өмнөх
      </button>
      <span className="text-sm text-gray-600">Хуудас {page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} className={buttonClass}>
        Дараах →
      </button>
    </div>
  )
}
