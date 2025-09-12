import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye } from "lucide-react"

export default async function OrdersPage() {
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

  // Get orders with customer information
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (
        company_name,
        contact_name
      )
    `,
    )
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "pending":
        return "default"
      case "confirmed":
        return "default"
      case "in_production":
        return "default"
      case "ready_to_ship":
        return "default"
      case "shipped":
        return "default"
      case "delivered":
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
          <Link
            href="/orders"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Orders
          </Link>
          {(profile.role === "admin" || profile.role === "sales") && (
            <Link href="/customers" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
              Customers
            </Link>
          )}
          {(profile.role === "admin" || profile.role === "ops") && (
            <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
              Products
            </Link>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground">Manage and track all orders</p>
          </div>
          {(profile.role === "admin" || profile.role === "sales") && (
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Order #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customers?.company_name} - {order.customers?.contact_name}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(order.status)}>{order.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>Total: ${order.total_amount}</span>
                        <span>Date: {new Date(order.order_date).toLocaleDateString()}</span>
                        {order.required_date && <span>Due: {new Date(order.required_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/orders/${order.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders found</p>
                {(profile.role === "admin" || profile.role === "sales") && (
                  <Button asChild className="mt-4">
                    <Link href="/orders/new">Create your first order</Link>
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
