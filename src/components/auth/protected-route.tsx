import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spinner } from '../ui/spinner'
import { useAuth } from '../../features/auth/auth-provider'

export function ProtectedRoute() {
  const { isLoading, isConfigured, session } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Spinner label="Checking your session..." />
  }

  if (!isConfigured || !session) {
    return <Navigate to="/auth" replace state={{ from: location }} />
  }

  return <Outlet />
}
