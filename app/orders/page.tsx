import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import Link from "next/link"
import { Plus, Eye, Package, Truck, CheckCircle, Clock, AlertTriangle, ArrowRight, Download, RotateCcw } from "lucide-react"

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

  // Get client's orders only with order items
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          name,
          sku
        )
      )
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning"
      case "confirmed":
        return "info"
      case "processing":
        return "info"
      case "packed":
        return "info"
      case "dispatched":
        return "success"
      case "delivered":
        return "success"
      case "cancelled":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusProgress = (status: string) => {
    switch (status) {
      case "pending":
        return { progress: 20, label: "Order Placed" }
      case "confirmed":
        return { progress: 40, label: "Confirmed" }
      case "processing":
        return { progress: 60, label: "Processing" }
      case "packed":
        return { progress: 80, label: "Packed & Ready" }
      case "dispatched":
        return { progress: 90, label: "Dispatched" }
      case "delivered":
        return { progress: 100, label: "Delivered" }
      case "cancelled":
        return { progress: 0, label: "Cancelled" }
      default:
        return { progress: 0, label: "Unknown" }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />
      case "processing":
        return <Package className="h-4 w-4" />
      case "packed":
        return <Package className="h-4 w-4" />
      case "dispatched":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <CheckCircle className="h-4 w-4" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Filter orders by status
  const activeOrders = orders?.filter(order => 
    ["pending", "confirmed", "processing", "packed", "dispatched"].includes(order.status)
  ) || []
  
  const completedOrders = orders?.filter(order => 
    order.status === "delivered"
  ) || []
  
  const cancelledOrders = orders?.filter(order => 
    order.status === "cancelled"
  ) || []

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Orders Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">My Orders</h1>
                <p className="text-muted-foreground">Track your orders and view order history</p>
              </div>
              <Button asChild>
                <Link href="/orders/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Place New Order
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                      <p className="text-2xl font-bold">{activeOrders.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{completedOrders.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{orders?.length || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">${orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2) || '0.00'}</p>
                    </div>
                    <Truck className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Tabs */}
            <Tabs defaultValue="active" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="active" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed ({completedOrders.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Cancelled ({cancelledOrders.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Orders */}
              <TabsContent value="active">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeOrders.length > 0 ? (
                      <div className="space-y-6">
                        {activeOrders.map((order) => {
                          const statusInfo = getStatusProgress(order.status)
                          return (
                            <div key={order.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                                    <Badge variant={getStatusColor(order.status)}>
                                      {getStatusIcon(order.status)}
                                      <span className="ml-1 capitalize">{order.status.replace("_", " ")}</span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    Placed on {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                                  
                                  {/* Order Items */}
                                  <div className="space-y-2 mb-4">
                                    {order.order_items?.slice(0, 3).map((item: any) => (
                                      <div key={item.id} className="flex items-center justify-between text-sm">
                                        <span>{item.products?.name} x {item.quantity}</span>
                                        <span>${item.total_price.toFixed(2)}</span>
                                      </div>
                                    ))}
                                    {order.order_items?.length > 3 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{order.order_items.length - 3} more items
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold">${order.total_amount?.toFixed(2) || '0.00'}</p>
                                  <Button asChild variant="outline" size="sm" className="mt-2">
                                    <Link href={`/orders/${order.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium">{statusInfo.label}</span>
                                  <span className="text-muted-foreground">{statusInfo.progress}%</span>
                                </div>
                                <Progress value={statusInfo.progress} className="h-2" />
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-3 mt-4">
                                <Button size="sm" variant="outline">
                                  <Truck className="h-4 w-4 mr-2" />
                                  Track Shipment
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download Invoice
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Active Orders</h3>
                        <p className="text-muted-foreground mb-6">
                          You don't have any active orders at the moment
                        </p>
                        <Button asChild>
                          <Link href="/orders/new">
                            <Plus className="h-4 w-4 mr-2" />
                            Place Your First Order
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Completed Orders */}
              <TabsContent value="completed">
                <Card>
                  <CardHeader>
                    <CardTitle>Completed Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {completedOrders.length > 0 ? (
                      <div className="space-y-4">
                        {completedOrders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                                  <Badge variant="success">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Delivered
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Delivered on {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">${order.total_amount?.toFixed(2) || '0.00'}</p>
                                <div className="flex gap-2 mt-2">
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={`/orders/${order.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Link>
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reorder
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
                          <CheckCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Completed Orders</h3>
                        <p className="text-muted-foreground">
                          Your completed orders will appear here
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cancelled Orders */}
              <TabsContent value="cancelled">
                <Card>
                  <CardHeader>
                    <CardTitle>Cancelled Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cancelledOrders.length > 0 ? (
                      <div className="space-y-4">
                        {cancelledOrders.map((order) => (
                          <div key={order.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                                  <Badge variant="destructive">
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Cancelled
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Cancelled on {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">${order.total_amount?.toFixed(2) || '0.00'}</p>
                                <Button asChild variant="outline" size="sm" className="mt-2">
                                  <Link href={`/orders/${order.id}`}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No Cancelled Orders</h3>
                        <p className="text-muted-foreground">
                          Great! You don't have any cancelled orders
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
