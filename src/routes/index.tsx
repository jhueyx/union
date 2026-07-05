// Union — application route table.
import { createBrowserRouter } from 'react-router-dom'
import RootLayout from '../layouts/RootLayout'
import AdminLayout from '../layouts/AdminLayout'
import Home from '../pages/Home'
import SaveTheDate from '../pages/SaveTheDate'
import Invitation from '../pages/Invitation'
import RsvpPage from '../pages/RsvpPage'
import InviteCode from '../pages/InviteCode'
import SchedulePage from '../pages/SchedulePage'
import TravelPage from '../pages/TravelPage'
import RegistryPage from '../pages/RegistryPage'
import FaqPage from '../pages/FaqPage'
import PhotosPage from '../pages/PhotosPage'
import GuestbookPage from '../pages/GuestbookPage'
import StoryPage from '../pages/StoryPage'
import NotFound from '../pages/NotFound'
import Dashboard from '../pages/admin/Dashboard'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'story', element: <StoryPage /> },
      { path: 'save-the-date', element: <SaveTheDate /> },
      { path: 'invitation', element: <Invitation /> },
      { path: 'rsvp', element: <RsvpPage /> },
      { path: 'i/:inviteCode', element: <InviteCode /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'travel', element: <TravelPage /> },
      { path: 'registry', element: <RegistryPage /> },
      { path: 'faq', element: <FaqPage /> },
      { path: 'photos', element: <PhotosPage /> },
      { path: 'guestbook', element: <GuestbookPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [{ index: true, element: <Dashboard /> }],
  },
])
