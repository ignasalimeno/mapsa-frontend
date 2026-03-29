import { Navigate } from 'react-router-dom'

export default function PrivateRoute({ children }) {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true'
  const channel = sessionStorage.getItem('channel')
  
  if (!isAuthenticated || !channel) {
    return <Navigate to="/login" replace />
  }
  
  return children
}
