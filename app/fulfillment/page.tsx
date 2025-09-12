import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react"

export default async function FulfillmentPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !["admin", "ops"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get fulfillment tasks with order information
  const { data: tasks } = await supabase
    .from("fulfillment_tasks")
    .select(`
      *,
      orders (
        order_number,
        customers (company_name, contact_name)
      ),
      profiles (full_name)
    `)
    .order("priority")
    .order("created_at")

  // Get recent shipments
  const { data: shipments } = await supabase
    .from("shipments")
    .select(`
      *,
      orders (
        order_number,
        customers (company_name, contact_name)
      ),
      shipping_carriers (name)
    `)
    .order("created_at", { ascending: false })
    .limit(10)

  const getTaskIcon = (taskType: string) => {
    switch (taskType) {
      case "pick":
        return <Package className="h-4 w-4 text-blue-600" />
      case "pack":
        return <Package className="h-4 w-4 text-green-600" />
      case "quality_check":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case "label":
        return <Package className="h-4 w-4 text-orange-600" />
      case "ship":
        return <Truck className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "on_hold":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "in_progress":
        return "default"
      case "completed":
        return "default"
      case "on_hold":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getShipmentStatusColor = (status: string) => {
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
          <Link
            href="/fulfillment"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            <Truck className="h-4 w-4" />
            Fulfillment
          </Link>
          <Link href="/shipping" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            <Package className="h-4 w-4" />
            Shipping
          </Link>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Products
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Fulfillment Center</h1>
            <p className="text-muted-foreground">Manage order fulfillment tasks and workflows</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/shipping/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Shipment
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fulfillment Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Fulfillment Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks && tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTaskIcon(task.task_type)}
                        <div>
                          <p className="font-medium capitalize">{task.task_type.replace("_", " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            Order #{task.orders?.order_number} - {task.orders?.customers?.company_name}
                          </p>
                          {task.profiles?.full_name && (
                            <p className="text-xs text-muted-foreground">Assigned: {task.profiles.full_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge variant={getStatusColor(task.status)}>{task.status.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No fulfillment tasks pending</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Shipments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Recent Shipments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shipments && shipments.length > 0 ? (
                <div className="space-y-3">
                  {shipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">#{shipment.shipment_number}</p>
                        <p className="text-sm text-muted-foreground">
                          Order #{shipment.orders?.order_number} - {shipment.orders?.customers?.company_name}
                        </p>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          {shipment.shipping_carriers?.name && <span>{shipment.shipping_carriers.name}</span>}
                          {shipment.tracking_number && <span>Tracking: {shipment.tracking_number}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={getShipmentStatusColor(shipment.status)}>
                          {shipment.status.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(shipment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No shipments yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
