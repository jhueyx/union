// Union — root layout wrapping all public pages.
import { Outlet } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { SiteContentProvider } from '../lib/siteContent'

export default function RootLayout() {
  return (
    <SiteContentProvider>
      <div className="animate-page-enter min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
        <Nav />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteContentProvider>
  )
}
