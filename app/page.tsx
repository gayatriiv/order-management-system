import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Client Portal</h1>
        <p className="text-xl text-muted-foreground max-w-2xl text-center mx-auto">
          Access your personalized client portal to place orders, track shipments, manage customizations, and handle invoices with ease.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Sign In to Portal</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/register">Create Account</Link>
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-semibold mb-2">Place Orders</h3>
            <p className="text-sm text-muted-foreground">Easy order placement with product selection and customization options</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="font-semibold mb-2">Track Shipments</h3>
            <p className="text-sm text-muted-foreground">Real-time tracking with AWB search and status updates</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="font-semibold mb-2">Customizations</h3>
            <p className="text-sm text-muted-foreground">Upload logos, artwork, and messages for personalized products</p>
          </div>
        </div>
      </div>
    </div>
  )
}
