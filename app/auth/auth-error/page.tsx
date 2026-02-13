import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">
            Authentication Error
          </h1>
          <p className="text-white/60">Something went wrong</p>
        </div>

        <Card>
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <p className="text-white/80">
              The confirmation link may have expired or is invalid.
            </p>

            <p className="text-sm text-white/60">
              Please try signing up again or contact support if the problem persists.
            </p>

            <div className="pt-4 space-y-2">
              <Link href="/auth/signup">
                <Button className="w-full">
                  Back to Sign Up
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="secondary" className="w-full">
                  Try Signing In
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
