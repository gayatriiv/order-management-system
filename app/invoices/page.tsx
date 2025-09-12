import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, FileText } from "lucide-react"

export default async function InvoicesPage() {
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

  // Get invoices with customer and order information
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (company_name, contact_name),
      orders (order_number)
    `)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "sent":
        return "default"
      case "viewed":
        return "default"
      case "paid":
        return "default"
      case "overdue":
        return "destructive"
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
          <Link
            href="/invoices"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <FileText className="h-4 w-4" />
            Invoices
          </Link>
          <Link href="/payments" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Payments
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage and track all invoices</p>
          </div>
          {(profile.role === "admin" || profile.role === "finance") && (
            <Button asChild>
              <Link href="/invoices/new">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {invoice.customers?.company_name} - {invoice.customers?.contact_name}
                          </p>
                          <p className="text-xs text-muted-foreground">Order #{invoice.orders?.order_number}</p>
                        </div>
                        <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>Amount: ${invoice.total_amount}</span>
                        <span>Issue Date: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                        <span>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</span>
                        {invoice.paid_date && <span>Paid: {new Date(invoice.paid_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No invoices found</p>
                {(profile.role === "admin" || profile.role === "finance") && (
                  <Button asChild className="mt-4">
                    <Link href="/invoices/new">Create your first invoice</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
