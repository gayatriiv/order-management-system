import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { Search, Truck, MapPin, Clock, CheckCircle, Package, AlertTriangle } from "lucide-react"

export default async function ShippingPage() {
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

  // Get client's shipped orders
  const { data: shippedOrders } = await supabase
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
    .in("status", ["dispatched", "delivered"])
    .order("updated_at", { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "dispatched":
        return <Truck className="h-4 w-4 text-blue-600" />
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "dispatched":
        return "info"
      case "delivered":
        return "success"
      default:
        return "secondary"
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Shipping & Tracking Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Track Shipments</h1>
              <p className="text-muted-foreground">Track your orders with AWB search and live status updates</p>
            </div>

            {/* AWB Search */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Track by AWB Number</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Enter AWB/Tracking number..."
                      className="pl-10"
                    />
                  </div>
                  <Button>Track Package</Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter your AWB number to get real-time tracking information
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                      <p className="text-2xl font-bold">{shippedOrders?.filter(order => order.status === 'dispatched').length || 0}</p>
                    </div>
                    <Truck className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Delivered</p>
                      <p className="text-2xl font-bold">{shippedOrders?.filter(order => order.status === 'delivered').length || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Shipments</p>
                      <p className="text-2xl font-bold">{shippedOrders?.length || 0}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Shipments List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Shipments</CardTitle>
              </CardHeader>
              <CardContent>
                {shippedOrders && shippedOrders.length > 0 ? (
                  <div className="space-y-6">
                    {shippedOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">Order #{order.order_number}</h3>
                              <Badge variant={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">{order.status}</span>
                              </Badge>
                            </div>
                            
                            {/* Order Items */}
                            <div className="space-y-2 mb-4">
                              {order.order_items?.slice(0, 2).map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <span>{item.products?.name} x {item.quantity}</span>
                                  <span className="text-muted-foreground">SKU: {item.products?.sku}</span>
                                </div>
                              ))}
                              {order.order_items?.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.order_items.length - 2} more items
                                </p>
                              )}
                            </div>

                            {/* Shipping Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Shipped to: {order.shipping_address || 'Default Address'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Truck className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">AWB: {order.tracking_number || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Shipped: {new Date(order.updated_at || order.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Weight: {order.total_weight || 'N/A'} kg</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">${order.total_amount?.toFixed(2) || '0.00'}</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              <Truck className="h-4 w-4 mr-2" />
                              Track Details
                            </Button>
                          </div>
                        </div>

                        {/* Tracking Timeline */}
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-3">Tracking Timeline</h4>
                          <div className="space-y-3">
                            {/* Example tracking events */}
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">Package delivered</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.status === 'delivered' ? 'Delivered to recipient' : 'Expected delivery'}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {order.status === 'delivered' ? new Date(order.updated_at || order.created_at).toLocaleDateString() : 'Pending'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">Out for delivery</p>
                                <p className="text-xs text-muted-foreground">Package is out for delivery</p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {order.status === 'dispatched' ? new Date(order.updated_at || order.created_at).toLocaleDateString() : 'Pending'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">In transit</p>
                                <p className="text-xs text-muted-foreground">Package is in transit to destination</p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {order.status === 'dispatched' ? new Date(order.updated_at || order.created_at).toLocaleDateString() : 'Pending'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">Package shipped</p>
                                <p className="text-xs text-muted-foreground">Package has been shipped from origin</p>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(order.updated_at || order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-4 pt-4 border-t">
                          <Button size="sm" variant="outline">
                            <MapPin className="h-4 w-4 mr-2" />
                            View Route
                          </Button>
                          <Button size="sm" variant="outline">
                            <Package className="h-4 w-4 mr-2" />
                            Delivery Proof
                          </Button>
                          {order.status === 'delivered' && (
                            <Button size="sm" variant="outline">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Rate Delivery
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Truck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Shipments Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Your shipped orders will appear here for tracking
                    </p>
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      View All Orders
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Partners */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Our Shipping Partners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">BlueDart</p>
                      <p className="text-sm text-muted-foreground">Express Delivery</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium">DTDC</p>
                      <p className="text-sm text-muted-foreground">Standard Delivery</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Delhivery</p>
                      <p className="text-sm text-muted-foreground">Fast Delivery</p>
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