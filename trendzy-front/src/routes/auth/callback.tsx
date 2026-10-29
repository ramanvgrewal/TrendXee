import { pageSeo } from "@/lib/seo";
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackComponent,
  head: () => pageSeo({ title: "Signing in — TrendXee", description: "Complete your secure sign-in to TrendXee.", noindex: true }),
})

function AuthCallbackComponent() {
  const navigate = useNavigate()
  
  useEffect(() => {
    // With cookie-based auth, the backend already set the cookie.
    // Just redirect to home.
    navigate({ to: '/' })
  }, [navigate])

  return (
    <div className="flex min-h-[70svh] w-full items-center justify-center px-5">
      <div className="flex flex-col items-center gap-5 text-center" role="status">
        <div className="size-9 animate-spin rounded-full border-2 border-clay border-t-transparent" />
        <h1 className="font-display text-2xl italic">Signing you in…</h1>
      </div>
    </div>
  )
}
