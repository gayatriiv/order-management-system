import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default async function CustomizationsPage() {
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

  // Get customization requests with related data
  const { data: customizations } = await supabase
    .from("customization_requests")
    .select(`
      *,
      order_items (
        *,
        orders (
          order_number,
          customers (company_name, contact_name)
        ),
        products (name, sku)
      ),
      profiles!customization_requests_requested_by_fkey (full_name),
      profiles!customization_requests_assigned_to_fkey (full_name)
    `)
    .order("created_at", { ascending: false })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "under_review":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "revision_needed":
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "default"
      case "under_review":
        return "default"
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      case "revision_needed":
        return "default"
      default:
        return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
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
            href="/customizations"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Customizations
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
            <h1 className="text-3xl font-bold">Customization Requests</h1>
            <p className="text-muted-foreground">Manage custom product requests and workflows</p>
          </div>
          {(profile.role === "admin" || profile.role === "sales" || profile.role === "ops") && (
            <Button asChild>
              <Link href="/customizations/new">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Customization Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {customizations && customizations.length > 0 ? (
              <div className="space-y-4">
                {customizations.map((customization) => (
                  <div key={customization.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{customization.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {customization.order_items?.products?.name} - Order #
                            {customization.order_items?.orders?.order_number}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {customization.order_items?.orders?.customers?.company_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(customization.status)}
                          <Badge variant={getStatusColor(customization.status)}>
                            {customization.status.replace("_", " ")}
                          </Badge>
                          <Badge variant={getPriorityColor(customization.priority)}>{customization.priority}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                        <span>Type: {customization.request_type}</span>
                        {customization.estimated_cost > 0 && <span>Est. Cost: ${customization.estimated_cost}</span>}
                        {customization.estimated_days > 0 && <span>Est. Days: {customization.estimated_days}</span>}
                        <span>Created: {new Date(customization.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/customizations/${customization.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No customization requests found</p>
                {(profile.role === "admin" || profile.role === "sales" || profile.role === "ops") && (
                  <Button asChild className="mt-4">
                    <Link href="/customizations/new">Create your first customization request</Link>
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
