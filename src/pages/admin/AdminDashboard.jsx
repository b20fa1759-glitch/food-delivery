import { Link } from 'react-router-dom'

const sections = [
  { to: '/admin/menu', icon: '🍔', title: 'Хоолны цэс', text: 'Хоол нэмэх, засах, устгах' },
]

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Админ самбар</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.to} to={s.to} className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6">
            <p className="text-3xl">{s.icon}</p>
            <h2 className="font-semibold text-lg mt-2">{s.title}</h2>
            <p className="text-gray-500 text-sm">{s.text}</p>
          </Link>
        ))}
      </div>
      <p className="text-sm text-gray-400 mt-8">Захиалга, орлогын график, хэрэглэгчийн жагсаалт Хамгаалалт-2-т нэмэгдэнэ.</p>
    </div>
  )
}
