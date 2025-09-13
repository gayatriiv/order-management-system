import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import Link from "next/link"
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Upload,
  Truck,
  FileText,
  Wrench,
  Eye,
  Download
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("Dashboard: User check", { user: user?.id, email: user?.email })

  if (!user) {
    console.log("Dashboard: No user, redirecting to login")
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  console.log("Dashboard: Profile check", { profile, profileError })

  if (!profile) {
    console.log("Dashboard: No profile, redirecting to login")
    redirect("/auth/login")
  }

  // Get client dashboard stats - only show user's own data
  const { data: orders } = await supabase.from("orders").select("id, status, total_amount, created_at").eq("customer_id", user.id)
  
  // Try to get customizations, but don't fail if table doesn't exist yet
  let customizations = null
  try {
    const { data } = await supabase.from("customization_requests").select("id, status").eq("customer_id", user.id)
    customizations = data
  } catch (error) {
    console.log("Customization requests table not found, skipping...")
  }

  // Try to get invoices
  let invoices = null
  try {
    const { data } = await supabase.from("invoices").select("id, status, amount, due_date").eq("customer_id", user.id)
    invoices = data
  } catch (error) {
    console.log("Invoices table not found, skipping...")
  }

  const activeOrders = orders?.filter((order) => ["pending", "confirmed", "processing", "packed", "dispatched"].includes(order.status)).length || 0
  const pendingApprovals = customizations?.filter((c) => c.status === "pending").length || 0
  const unpaidInvoices = invoices?.filter((i) => i.status === "unpaid").length || 0
  const recentShipments = orders?.filter((order) => ["dispatched", "delivered"].includes(order.status)).length || 0

  return (
    <div className="flex min-h-screen bg-background">
      {/* Optional Sidebar - can be toggled */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Welcome back, {profile.full_name || user.email?.split('@')[0]}!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Manage your orders, track shipments, and handle customizations from your client portal.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-2">
                <Badge variant="outline" className="capitalize">
                  Client Account
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{activeOrders}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 text-warning mr-1" />
                  In progress
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
                <Wrench className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingApprovals}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                  Awaiting review
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Unpaid Invoices</CardTitle>
                <FileText className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{unpaidInvoices}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <DollarSign className="h-3 w-3 text-destructive mr-1" />
                  Payment due
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Shipments</CardTitle>
                <Truck className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{recentShipments}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3 text-success mr-1" />
                  Shipped/Delivered
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Place New Order */}
            <Card className="card-enterprise hover-lift cursor-pointer group">
              <Link href="/orders/new">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Place New Order</h3>
                  <p className="text-sm text-muted-foreground">Start a new order with product selection and customization options</p>
                </CardContent>
              </Link>
            </Card>

            {/* Track Shipments */}
            <Card className="card-enterprise hover-lift cursor-pointer group">
              <Link href="/shipping">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                    <Truck className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Track Shipments</h3>
                  <p className="text-sm text-muted-foreground">Track your orders with AWB search and live status updates</p>
                </CardContent>
              </Link>
            </Card>

            {/* Download Invoices */}
            <Card className="card-enterprise hover-lift cursor-pointer group">
              <Link href="/invoices">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Download className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Download Invoices</h3>
                  <p className="text-sm text-muted-foreground">Download GST-compliant invoices and manage payments</p>
                </CardContent>
              </Link>
            </Card>

            {/* Customization Requests */}
            <Card className="card-enterprise hover-lift cursor-pointer group">
              <Link href="/customizations">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning/20 transition-colors">
                    <Upload className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Customization Requests</h3>
                  <p className="text-sm text-muted-foreground">Upload logos, artwork, and messages for your orders</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Orders & Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Recent Orders */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <CardDescription>Your latest order activity</CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                        <Link href={`/orders/${order.id}`} className="flex items-center space-x-3 flex-1">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground font-mono">
                            ${order.total_amount?.toFixed(2) || '0.00'}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              order.status === 'pending' ? 'badge-warning' :
                              order.status === 'confirmed' ? 'badge-info' :
                              order.status === 'shipped' || order.status === 'delivered' ? 'badge-success' :
                              'badge-error'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/orders">View All Orders</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create your first order to get started</p>
                    <Button asChild className="mt-4">
                      <Link href="/orders/new">Place Your First Order</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Summary */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Account Summary</CardTitle>
                <CardDescription>Your account overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <Badge variant="outline" className="badge-success">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Orders</span>
                  <span className="font-semibold">{orders?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pending Customizations</span>
                  <span className="font-semibold">{pendingApprovals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Unpaid Invoices</span>
                  <span className="font-semibold text-destructive">{unpaidInvoices}</span>
                </div>
                <div className="pt-2 border-t">
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/support">Contact Support</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
