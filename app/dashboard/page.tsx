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
  ArrowDownRight
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

  // Get dashboard stats
  const { data: orders } = await supabase.from("orders").select("id, status, total_amount")
  const { data: customers } = await supabase.from("customers").select("id")
  const { data: products } = await supabase.from("products").select("id")
  
  // Try to get customizations, but don't fail if table doesn't exist yet
  let customizations = null
  try {
    const { data } = await supabase.from("customization_requests").select("id, status")
    customizations = data
  } catch (error) {
    console.log("Customization requests table not found, skipping...")
  }

  const totalOrders = orders?.length || 0
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
  const pendingOrders = orders?.filter((order) => order.status === "pending").length || 0
  const pendingCustomizations = customizations?.filter((c) => c.status === "pending").length || 0

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole={profile.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {profile.full_name}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="capitalize">
                {profile.role}
              </Badge>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalOrders}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success mr-1" />
                  +12% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground font-mono">${totalRevenue.toFixed(2)}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success mr-1" />
                  +8.2% from last month
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingOrders}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <AlertTriangle className="h-3 w-3 text-warning mr-1" />
                  {pendingOrders > 5 ? "High volume" : "Normal"}
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customizations</CardTitle>
                <Package className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{pendingCustomizations}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3 text-success mr-1" />
                  In progress
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{customers?.length || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <ArrowUpRight className="h-3 w-3 text-success mr-1" />
                  +3 this week
                </div>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{products?.length || 0}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <CheckCircle className="h-3 w-3 text-success mr-1" />
                  Active catalog
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                <CardDescription>Common tasks for your role</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(profile.role === "admin" || profile.role === "sales") && (
                  <Button asChild className="w-full justify-start btn-primary">
                    <Link href="/orders/new">Create New Order</Link>
                  </Button>
                )}
                <Button asChild variant="outline" className="w-full justify-start btn-outline">
                  <Link href="/orders">View All Orders</Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start btn-outline">
                  <Link href="/customizations">View Customizations</Link>
                </Button>
                {(profile.role === "admin" || profile.role === "sales") && (
                  <Button asChild variant="outline" className="w-full justify-start btn-outline">
                    <Link href="/customers/new">Add New Customer</Link>
                  </Button>
                )}
                {(profile.role === "admin" || profile.role === "ops") && (
                  <Button asChild variant="outline" className="w-full justify-start btn-outline">
                    <Link href="/products/new">Add New Product</Link>
                  </Button>
                )}
                {(profile.role === "admin" || profile.role === "ops" || profile.role === "finance") && (
                  <Button asChild variant="outline" className="w-full justify-start btn-outline">
                    <Link href="/inventory">Manage Inventory</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="card-enterprise">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
                <CardDescription>Latest order activity</CardDescription>
              </CardHeader>
              <CardContent>
                {orders && orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Order #{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {order.status.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground font-mono">
                            ${order.total_amount?.toFixed(2) || '0.00'}
                          </p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              order.status === 'pending' ? 'badge-warning' :
                              order.status === 'confirmed' ? 'badge-info' :
                              order.status === 'shipped' ? 'badge-success' :
                              'badge-error'
                            }`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Create your first order to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
