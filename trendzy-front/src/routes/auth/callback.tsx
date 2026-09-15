import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackComponent,
})

function AuthCallbackComponent() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // With cookie-based auth, the backend already set the cookie.
    // Just redirect to home.
    navigate({ to: '/' })
  }, [navigate])

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg font-medium">Authenticating...</p>
      </div>
    </div>
  )
}
