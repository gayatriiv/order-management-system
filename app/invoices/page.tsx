import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import Link from "next/link"
import { Download, Eye, FileText, Search, Filter, CreditCard, CheckCircle, Clock, AlertTriangle, DollarSign, Calendar } from "lucide-react"

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

  // Get client's invoices only
  const { data: invoices } = await supabase
    .from("invoices")
    .select(`
      *,
      orders (order_number)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "unpaid":
        return "warning"
      case "paid":
        return "success"
      case "overdue":
        return "destructive"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "unpaid":
        return <Clock className="h-4 w-4" />
      case "paid":
        return <CheckCircle className="h-4 w-4" />
      case "overdue":
        return <AlertTriangle className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Filter invoices by status
  const unpaidInvoices = invoices?.filter(invoice => invoice.status === 'unpaid') || []
  const paidInvoices = invoices?.filter(invoice => invoice.status === 'paid') || []
  const overdueInvoices = invoices?.filter(invoice => invoice.status === 'overdue') || []
  
  const totalUnpaid = unpaidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
  const totalPaid = paidInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Invoices & Payments Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Invoices & Payments</h1>
              <p className="text-muted-foreground">Manage your invoices and make payments</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Unpaid Invoices</p>
                      <p className="text-2xl font-bold">{unpaidInvoices.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-warning" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Amount Due</p>
                      <p className="text-2xl font-bold">${totalUnpaid.toFixed(2)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-destructive" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Paid Invoices</p>
                      <p className="text-2xl font-bold">{paidInvoices.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                      <p className="text-2xl font-bold">${totalPaid.toFixed(2)}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Invoices Tabs */}
            <Tabs defaultValue="unpaid" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="unpaid" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Unpaid ({unpaidInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="paid" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Paid ({paidInvoices.length})
                </TabsTrigger>
                <TabsTrigger value="overdue" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue ({overdueInvoices.length})
                </TabsTrigger>
              </TabsList>

              {/* Unpaid Invoices */}
              <TabsContent value="unpaid">
                <Card>
                  <CardHeader>
                    <CardTitle>Unpaid Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unpaidInvoices.length > 0 ? (
                      <div className="space-y-4">
                        {unpaidInvoices.map((invoice) => (
                          <div key={invoice.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Invoice #{invoice.invoice_number}</h3>
                                  <Badge variant={getStatusColor(invoice.status)}>
                                    {getStatusIcon(invoice.status)}
                                    <span className="ml-1 capitalize">{invoice.status}</span>
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  For Order #{invoice.orders?.order_number} • Issued: {new Date(invoice.issue_date).toLocaleDateString()}
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Amount: <span className="font-semibold">${invoice.total_amount?.toFixed(2) || '0.00'}</span></span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">GST Compliant</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="space-y-2">
                                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now
                                  </Button>
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/invoices/${invoice.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t">
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-2" />
                                Print Invoice
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                        <p className="text-muted-foreground">
                          You don't have any unpaid invoices at the moment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Paid Invoices */}
              <TabsContent value="paid">
                <Card>
                  <CardHeader>
                    <CardTitle>Paid Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paidInvoices.length > 0 ? (
                      <div className="space-y-4">
                        {paidInvoices.map((invoice) => (
                          <div key={invoice.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Invoice #{invoice.invoice_number}</h3>
                                  <Badge variant="success">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Paid
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  For Order #{invoice.orders?.order_number} • Paid: {new Date(invoice.paid_date || invoice.updated_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <span>Amount: <span className="font-semibold">${invoice.total_amount?.toFixed(2) || '0.00'}</span></span>
                                  <span>Payment Method: {invoice.payment_method || 'N/A'}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="space-y-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/invoices/${invoice.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Link>
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Receipt
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Paid Invoices</h3>
                        <p className="text-muted-foreground">
                          Your paid invoices will appear here
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Overdue Invoices */}
              <TabsContent value="overdue">
                <Card>
                  <CardHeader>
                    <CardTitle>Overdue Invoices</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overdueInvoices.length > 0 ? (
                      <div className="space-y-4">
                        {overdueInvoices.map((invoice) => (
                          <div key={invoice.id} className="border border-red-200 rounded-lg p-6 bg-red-50/50">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Invoice #{invoice.invoice_number}</h3>
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Overdue
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  For Order #{invoice.orders?.order_number} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                                </p>
                                
                                <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-4">
                                  <p className="text-sm text-red-800">
                                    <AlertTriangle className="h-4 w-4 inline mr-2" />
                                    This invoice is overdue. Please make payment as soon as possible to avoid additional charges.
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="space-y-2">
                                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay Now
                                  </Button>
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/invoices/${invoice.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Overdue Invoices</h3>
                        <p className="text-muted-foreground">
                          Great! You don't have any overdue invoices
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Payment Methods */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Accepted Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Razorpay</p>
                      <p className="text-sm text-muted-foreground">Cards, UPI, Net Banking</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">💳</span>
                    </div>
                    <div>
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-muted-foreground">Direct UPI Payment</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">🏦</span>
                    </div>
                    <div>
                      <p className="font-medium">NEFT</p>
                      <p className="text-sm text-muted-foreground">Bank Transfer</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-lg">📄</span>
                    </div>
                    <div>
                      <p className="font-medium">Cheque</p>
                      <p className="text-sm text-muted-foreground">Physical Cheque</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
