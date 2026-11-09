import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-brand-50/40">
      <Navbar />
      {/* <Outlet /> shows the page that matches the current URL */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
