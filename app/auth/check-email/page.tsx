import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email and click the confirmation link to activate your account. You can then sign in to
              access the Order Management System.
            </p>
            <div className="p-3 bg-amber-50 rounded-md text-sm border border-amber-200">
              <p className="font-medium text-amber-900">Email not received?</p>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Wait a few minutes for delivery</li>
                <li>• Make sure you used a valid email address</li>
                <li>• Try registering again if needed</li>
              </ul>
            </div>
            <div className="p-3 bg-blue-50 rounded-md text-sm">
              <p className="font-medium text-blue-900">Development Note:</p>
              <p className="text-blue-700">
                In development, email delivery may be delayed. If you&apos;re testing, you can try logging in directly
                after a few minutes.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/auth/login">Try Login</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/auth/register">Register Again</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
