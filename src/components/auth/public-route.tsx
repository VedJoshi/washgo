import { Navigate, Outlet } from 'react-router-dom'
import { Spinner } from '../ui/spinner'
import { useAuth } from '../../features/auth/auth-provider'

export function PublicRoute() {
  const { isLoading, isConfigured, session } = useAuth()

  if (isLoading) {
    return <Spinner label="Checking your session..." />
  }

  if (isConfigured && session) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
