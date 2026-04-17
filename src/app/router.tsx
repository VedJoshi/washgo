import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../components/auth/protected-route'
import { PublicRoute } from '../components/auth/public-route'
import { AppShell } from '../components/layout/app-shell'
import { AssistantPage } from '../pages/assistant-page'
import { AuthPage } from '../pages/auth-page'
import { BookingPage } from '../pages/booking-page'
import { DashboardPage } from '../pages/dashboard-page'
import { HistoryRoutePage } from '../pages/history-page'
import { LensRoutePage } from '../pages/lens-page'
import { VehiclePage } from '../pages/vehicle-page'

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [{ path: '/auth', element: <AuthPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'vehicle', element: <VehiclePage /> },
          { path: 'booking', element: <BookingPage /> },
          { path: 'assistant', element: <AssistantPage /> },
          { path: 'lens', element: <LensRoutePage /> },
          { path: 'history', element: <HistoryRoutePage /> },
        ],
      },
    ],
  },
])
