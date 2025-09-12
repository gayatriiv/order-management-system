import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, CreditCard } from "lucide-react"

export default async function PaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get payments with invoice and customer information
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      invoices (
        invoice_number,
        total_amount,
        customers (company_name, contact_name)
      )
    `)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "processing":
        return "default"
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "refunded":
        return "default"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r">
        <div className="p-6">
          <h2 className="text-lg font-semibold">OMS Dashboard</h2>
          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
        </div>
        <nav className="px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Dashboard
          </Link>
          <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Orders
          </Link>
          <Link href="/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Billing
          </Link>
          <Link href="/invoices" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Invoices
          </Link>
          <Link
            href="/payments"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <CreditCard className="h-4 w-4" />
            Payments
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-muted-foreground">Track and manage all payments</p>
          </div>
          {(profile.role === "admin" || profile.role === "finance") && (
            <Button asChild>
              <Link href="/payments/new">
                <Plus className="h-4 w-4 mr-2" />
                Record Payment
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Payment #{payment.payment_number}</p>
                          <p className="text-sm text-muted-foreground">Invoice #{payment.invoices?.invoice_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.invoices?.customers?.company_name} - {payment.invoices?.customers?.contact_name}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(payment.payment_status)}>{payment.payment_status}</Badge>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>Amount: ${payment.amount}</span>
                        <span className="capitalize">Method: {payment.payment_method.replace("_", " ")}</span>
                        <span>Date: {new Date(payment.payment_date).toLocaleDateString()}</span>
                        {payment.transaction_id && <span>Transaction: {payment.transaction_id}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${payment.amount}</p>
                      <Button asChild variant="outline" size="sm" className="mt-2 bg-transparent">
                        <Link href={`/payments/${payment.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payments found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
