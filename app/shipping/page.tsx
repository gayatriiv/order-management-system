import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Truck, Package } from "lucide-react"

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

  // Get shipments with related data
  const { data: shipments } = await supabase
    .from("shipments")
    .select(`
      *,
      orders (
        order_number,
        customers (company_name, contact_name)
      ),
      shipping_carriers (name, code)
    `)
    .order("created_at", { ascending: false })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "processing":
        return "default"
      case "shipped":
        return "default"
      case "in_transit":
        return "default"
      case "delivered":
        return "default"
      case "exception":
        return "destructive"
      case "returned":
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
          {(profile.role === "admin" || profile.role === "ops") && (
            <Link href="/fulfillment" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
              <Truck className="h-4 w-4" />
              Fulfillment
            </Link>
          )}
          <Link
            href="/shipping"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Package className="h-4 w-4" />
            Shipping
          </Link>
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
            <h1 className="text-3xl font-bold">Shipping Management</h1>
            <p className="text-muted-foreground">Track and manage all shipments</p>
          </div>
          {(profile.role === "admin" || profile.role === "ops") && (
            <Button asChild>
              <Link href="/shipping/new">
                <Plus className="h-4 w-4 mr-2" />
                New Shipment
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {shipments && shipments.length > 0 ? (
              <div className="space-y-4">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">Shipment #{shipment.shipment_number}</p>
                          <p className="text-sm text-muted-foreground">
                            Order #{shipment.orders?.order_number} - {shipment.orders?.customers?.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{shipment.orders?.customers?.contact_name}</p>
                        </div>
                        <Badge variant={getStatusColor(shipment.status)}>{shipment.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        {shipment.shipping_carriers?.name && <span>Carrier: {shipment.shipping_carriers.name}</span>}
                        {shipment.tracking_number && <span>Tracking: {shipment.tracking_number}</span>}
                        {shipment.service_type && <span>Service: {shipment.service_type}</span>}
                        <span>Created: {new Date(shipment.created_at).toLocaleDateString()}</span>
                        {shipment.estimated_delivery_date && (
                          <span>Est. Delivery: {new Date(shipment.estimated_delivery_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/shipping/${shipment.id}`}>
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
                <p className="text-muted-foreground">No shipments found</p>
                {(profile.role === "admin" || profile.role === "ops") && (
                  <Button asChild className="mt-4">
                    <Link href="/shipping/new">Create your first shipment</Link>
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
