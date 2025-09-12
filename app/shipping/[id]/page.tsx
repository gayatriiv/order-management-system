import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, Truck, Package, MapPin } from "lucide-react"

interface ShipmentPageProps {
  params: Promise<{ id: string }>
}

export default async function ShipmentPage({ params }: ShipmentPageProps) {
  const { id } = await params
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

  // Get shipment with related data
  const { data: shipment } = await supabase
    .from("shipments")
    .select(`
      *,
      orders (
        order_number,
        customers (company_name, contact_name, email, phone)
      ),
      shipping_carriers (name, code),
      profiles (full_name)
    `)
    .eq("id", id)
    .single()

  if (!shipment) {
    notFound()
  }

  // Get shipment items
  const { data: shipmentItems } = await supabase
    .from("shipment_items")
    .select(`
      *,
      order_items (
        quantity,
        products (name, sku)
      )
    `)
    .eq("shipment_id", id)

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
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/shipping">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shipping
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Shipment #{shipment.shipment_number}</h1>
          <p className="text-muted-foreground">Shipment details and tracking information</p>
        </div>
        {(profile.role === "admin" || profile.role === "ops") && (
          <Button asChild>
            <Link href={`/shipping/${shipment.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Shipment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(shipment.status)}>{shipment.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carrier</p>
                  <p>{shipment.shipping_carriers?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Service Type</p>
                  <p className="capitalize">{shipment.service_type || "Standard"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tracking Number</p>
                  <p className="font-mono">{shipment.tracking_number || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Shipping Cost</p>
                  <p className="font-semibold">${shipment.shipping_cost}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p>{shipment.profiles?.full_name || "System"}</p>
                </div>
              </div>
              {shipment.estimated_delivery_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estimated Delivery</p>
                  <p>{new Date(shipment.estimated_delivery_date).toLocaleDateString()}</p>
                </div>
              )}
              {shipment.actual_delivery_date && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actual Delivery</p>
                  <p>{new Date(shipment.actual_delivery_date).toLocaleDateString()}</p>
                </div>
              )}
              {shipment.special_instructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Special Instructions</p>
                  <p className="text-sm">{shipment.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {shipment.weight_lbs && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Weight</p>
                    <p>{shipment.weight_lbs} lbs</p>
                  </div>
                )}
                {shipment.length_in && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Length</p>
                    <p>{shipment.length_in} in</p>
                  </div>
                )}
                {shipment.width_in && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Width</p>
                    <p>{shipment.width_in} in</p>
                  </div>
                )}
                {shipment.height_in && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Height</p>
                    <p>{shipment.height_in} in</p>
                  </div>
                )}
              </div>
              {shipment.declared_value && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">Declared Value</p>
                  <p className="font-semibold">${shipment.declared_value}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipment Items */}
          {shipmentItems && shipmentItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Items in Shipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {shipmentItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.order_items?.products?.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.order_items?.products?.sku}</p>
                      </div>
                      <p className="font-semibold">Qty: {item.quantity_shipped}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Related Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                <p className="font-medium">#{shipment.orders?.order_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p>{shipment.orders?.customers?.company_name}</p>
                <p className="text-sm text-muted-foreground">{shipment.orders?.customers?.contact_name}</p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/orders/${shipment.order_id}`}>View Full Order</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Shipping Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ship To</p>
                <div className="text-sm">
                  <p className="font-medium">{shipment.ship_to_name}</p>
                  {shipment.ship_to_company && <p>{shipment.ship_to_company}</p>}
                  <p>{shipment.ship_to_address}</p>
                  <p>
                    {shipment.ship_to_city}, {shipment.ship_to_state} {shipment.ship_to_zip}
                  </p>
                  {shipment.ship_to_phone && <p>Phone: {shipment.ship_to_phone}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ship From</p>
                <div className="text-sm">
                  <p className="font-medium">{shipment.ship_from_name}</p>
                  {shipment.ship_from_company && <p>{shipment.ship_from_company}</p>}
                  <p>{shipment.ship_from_address}</p>
                  <p>
                    {shipment.ship_from_city}, {shipment.ship_from_state} {shipment.ship_from_zip}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="font-medium">Created</p>
                <p className="text-muted-foreground">{new Date(shipment.created_at).toLocaleString()}</p>
              </div>
              {shipment.shipped_date && (
                <div className="text-sm">
                  <p className="font-medium">Shipped</p>
                  <p className="text-muted-foreground">{new Date(shipment.shipped_date).toLocaleString()}</p>
                </div>
              )}
              {shipment.actual_delivery_date && (
                <div className="text-sm">
                  <p className="font-medium">Delivered</p>
                  <p className="text-muted-foreground">{new Date(shipment.actual_delivery_date).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
