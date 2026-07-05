// Union — root layout wrapping all public pages.
import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function RootLayout() {
  return (
    <div className="animate-page-enter min-h-screen flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-50">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
