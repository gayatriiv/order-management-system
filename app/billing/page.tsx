import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, DollarSign, FileText, CreditCard, AlertTriangle } from "lucide-react"

export default async function BillingPage() {
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

  // Get invoices with customer information
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      customers (company_name, contact_name),
      orders (order_number)
    `)
    .order("created_at", { ascending: false })

  // Get recent payments
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      *,
      invoices (
        invoice_number,
        customers (company_name)
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10)

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

  const getPaymentStatusColor = (status: string) => {
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

  // Calculate totals
  const totalInvoiced = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  const totalPaid =
    invoices?.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  const totalOutstanding = totalInvoiced - totalPaid
  const overdueInvoices = invoices?.filter((inv) => inv.status === "overdue").length || 0

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
          <Link
            href="/billing"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <DollarSign className="h-4 w-4" />
            Billing
          </Link>
          <Link href="/invoices" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            <FileText className="h-4 w-4" />
            Invoices
          </Link>
          <Link href="/payments" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            <CreditCard className="h-4 w-4" />
            Payments
          </Link>
          {(profile.role === "admin" || profile.role === "sales") && (
            <Link href="/customers" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
              Customers
            </Link>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Billing & Payments</h1>
            <p className="text-muted-foreground">Manage invoices, payments, and financial transactions</p>
          </div>
          {(profile.role === "admin" || profile.role === "finance") && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/payments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Payment
                </Link>
              </Button>
              <Button asChild>
                <Link href="/invoices/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Invoice
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoiced</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalInvoiced.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${totalOutstanding.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueInvoices}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices && invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.slice(0, 8).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">#{invoice.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.customers?.company_name} - Order #{invoice.orders?.order_number}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                          <span>${invoice.total_amount}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No invoices yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">#{payment.payment_number}</p>
                        <p className="text-sm text-muted-foreground">Invoice #{payment.invoices?.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{payment.invoices?.customers?.company_name}</p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{payment.payment_method.replace("_", " ")}</span>
                          <span>{new Date(payment.payment_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${payment.amount}</p>
                        <Badge variant={getPaymentStatusColor(payment.payment_status)}>{payment.payment_status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No payments yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
