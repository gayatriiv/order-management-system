import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { BarChart3, TrendingUp, Package, Users, DollarSign, ShoppingCart, AlertTriangle } from "lucide-react"

export default async function AnalyticsPage() {
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

  // Only allow admin, ops, and finance to view analytics
  if (!["admin", "ops", "finance"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get analytics data
  const [
    { data: orderStats },
    { data: revenueStats },
    { data: inventoryStats },
    { data: customerStats },
    { data: paymentStats },
    { data: lowStockItems },
    { data: recentOrders },
    { data: topCustomers },
  ] = await Promise.all([
    // Order statistics
    supabase
      .from("orders")
      .select("order_status, total_amount, created_at"),

    // Revenue by month
    supabase.rpc("get_monthly_revenue"),

    // Inventory statistics
    supabase
      .from("inventory_analytics")
      .select("*"),

    // Customer statistics
    supabase
      .from("customer_analytics")
      .select("*")
      .order("total_spent", { ascending: false })
      .limit(10),

    // Payment statistics
    supabase
      .from("payment_analytics")
      .select("*"),

    // Low stock items
    supabase
      .from("inventory_analytics")
      .select("*")
      .eq("stock_status", "low_stock")
      .limit(10),

    // Recent orders
    supabase
      .from("orders")
      .select(`
      *,
      customers (company_name, contact_name)
    `)
      .order("created_at", { ascending: false })
      .limit(5),

    // Top customers
    supabase
      .from("customer_analytics")
      .select("*")
      .order("total_spent", { ascending: false })
      .limit(5),
  ])

  // Calculate key metrics
  const totalOrders = orderStats?.length || 0
  const totalRevenue = orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const pendingOrders = orderStats?.filter((order) => order.order_status === "pending").length || 0

  const totalProducts = inventoryStats?.length || 0
  const lowStockCount = inventoryStats?.filter((item) => item.stock_status === "low_stock").length || 0
  const outOfStockCount = inventoryStats?.filter((item) => item.stock_status === "out_of_stock").length || 0

  const totalCustomers = customerStats?.length || 0
  const activeCustomers = customerStats?.filter((customer) => customer.total_orders > 0).length || 0

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
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Products
          </Link>
          <Link href="/inventory" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Inventory
          </Link>
          <Link href="/billing" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Billing
          </Link>
          <Link
            href="/analytics"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics & Reports</h1>
          <p className="text-muted-foreground">Business intelligence and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Avg: ${avgOrderValue.toFixed(2)} per order</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">{pendingOrders} pending orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">{activeCustomers} active customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">{lowStockCount + outOfStockCount} need attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders && recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.customers?.company_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${order.total_amount}</p>
                        <Badge variant="outline">{order.order_status}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No recent orders</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers && topCustomers.length > 0 ? (
                  topCustomers.map((customer, index) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{customer.company_name}</p>
                          <p className="text-sm text-muted-foreground">{customer.contact_name}</p>
                          <p className="text-xs text-muted-foreground">{customer.total_orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${customer.total_spent?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Avg: ${customer.avg_order_value?.toFixed(2)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No customer data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems && lowStockItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm">Stock: {item.quantity_on_hand}</span>
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Low Stock
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((status) => {
                const count = orderStats?.filter((order) => order.order_status === status).length || 0
                const percentage = totalOrders > 0 ? ((count / totalOrders) * 100).toFixed(1) : "0"

                return (
                  <div key={status} className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground capitalize">{status}</p>
                    <p className="text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
