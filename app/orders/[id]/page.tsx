import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit } from "lucide-react"

interface OrderPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: OrderPageProps) {
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

  // Get order with related data
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (
        company_name,
        contact_name,
        email,
        phone,
        address,
        city,
        state,
        zip_code
      ),
      order_items (
        *,
        products (
          name,
          sku
        )
      ),
      profiles!orders_created_by_fkey (
        full_name
      )
    `,
    )
    .eq("id", id)
    .single()

  if (!order) {
    notFound()
  }

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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
          <p className="text-muted-foreground">Order details and status</p>
        </div>
        {(profile.role === "admin" || profile.role === "sales") && (
          <Button asChild>
            <Link href={`/orders/${order.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(order.status)}>{order.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">${order.total_amount}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p>{new Date(order.order_date).toLocaleDateString()}</p>
                </div>
                {order.required_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Required Date</p>
                    <p>{new Date(order.required_date).toLocaleDateString()}</p>
                  </div>
                )}
                {order.shipped_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Shipped Date</p>
                    <p>{new Date(order.shipped_date).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created By</p>
                  <p>{order.profiles?.full_name || "Unknown"}</p>
                </div>
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.products?.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.products?.sku}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity} × ${item.unit_price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${item.total_price}</p>
                      <Badge variant="outline" className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Information */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p className="font-medium">{order.customers?.company_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact</p>
                <p>{order.customers?.contact_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{order.customers?.email}</p>
              </div>
              {order.customers?.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p>{order.customers.phone}</p>
                </div>
              )}
              {order.customers?.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-sm">
                    {order.customers.address}
                    <br />
                    {order.customers.city}, {order.customers.state} {order.customers.zip_code}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
