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
        <h1 className="text-4xl font-bold tracking-tight">Order Management System</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Streamline your order processing, inventory management, and customer relationships with our comprehensive OMS
          platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/auth/register">Register</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
