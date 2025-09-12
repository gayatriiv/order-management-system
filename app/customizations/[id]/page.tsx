import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Edit, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react"

interface CustomizationPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomizationPage({ params }: CustomizationPageProps) {
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

  // Get customization request with related data
  const { data: customization } = await supabase
    .from("customization_requests")
    .select(`
      *,
      order_items (
        *,
        orders (
          order_number,
          customers (company_name, contact_name, email)
        ),
        products (name, sku)
      ),
      profiles!customization_requests_requested_by_fkey (full_name),
      profiles!customization_requests_assigned_to_fkey (full_name),
      profiles!customization_requests_reviewed_by_fkey (full_name)
    `)
    .eq("id", id)
    .single()

  if (!customization) {
    notFound()
  }

  // Get workflow steps
  const { data: workflowSteps } = await supabase
    .from("customization_workflow_steps")
    .select(`
      *,
      profiles (full_name)
    `)
    .eq("customization_request_id", id)
    .order("step_order")

  // Get comments
  const { data: comments } = await supabase
    .from("customization_comments")
    .select(`
      *,
      profiles (full_name, role)
    `)
    .eq("customization_request_id", id)
    .order("created_at")

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "in_progress":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
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

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="sm">
          <Link href="/customizations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customizations
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{customization.title}</h1>
          <p className="text-muted-foreground">Customization request details and workflow</p>
        </div>
        {(profile.role === "admin" || profile.role === "ops") && (
          <Button asChild>
            <Link href={`/customizations/${customization.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(customization.status)}>{customization.status.replace("_", " ")}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Priority</p>
                  <Badge variant="outline">{customization.priority}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Request Type</p>
                  <p className="capitalize">{customization.request_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                  <p>{customization.profiles?.full_name || "Unknown"}</p>
                </div>
                {customization.estimated_cost > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                    <p className="font-semibold">${customization.estimated_cost}</p>
                  </div>
                )}
                {customization.estimated_days > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Estimated Days</p>
                    <p>{customization.estimated_days} days</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm mt-1">{customization.description}</p>
              </div>
              {customization.specifications && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Specifications</p>
                  <pre className="text-sm mt-1 bg-muted p-3 rounded-lg overflow-auto">
                    {JSON.stringify(customization.specifications, null, 2)}
                  </pre>
                </div>
              )}
              {customization.review_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Review Notes</p>
                  <p className="text-sm mt-1">{customization.review_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {workflowSteps && workflowSteps.length > 0 ? (
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                          {index + 1}
                        </div>
                        {getStatusIcon(step.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{step.step_name}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">Status: {step.status.replace("_", " ")}</span>
                          {step.profiles?.full_name && <span>Assigned: {step.profiles.full_name}</span>}
                          {step.estimated_hours && <span>Est: {step.estimated_hours}h</span>}
                          {step.actual_hours && <span>Actual: {step.actual_hours}h</span>}
                        </div>
                        {step.notes && <p className="text-sm text-muted-foreground mt-1">{step.notes}</p>}
                      </div>
                      <Badge variant={step.status === "completed" ? "default" : "outline"}>
                        {step.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No workflow steps defined</p>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comments & Communication</CardTitle>
              <Button size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Add Comment
              </Button>
            </CardHeader>
            <CardContent>
              {comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{comment.profiles?.full_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {comment.profiles?.role} • {new Date(comment.created_at).toLocaleString()}
                            {comment.is_internal && " • Internal"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm">{comment.comment_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No comments yet</p>
              )}
            </CardContent>
          </Card>
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
                <p className="font-medium">#{customization.order_items?.orders?.order_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Product</p>
                <p>{customization.order_items?.products?.name}</p>
                <p className="text-sm text-muted-foreground">SKU: {customization.order_items?.products?.sku}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                <p>{customization.order_items?.orders?.customers?.company_name}</p>
                <p className="text-sm text-muted-foreground">
                  {customization.order_items?.orders?.customers?.contact_name}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/orders/${customization.order_items?.orders?.id}`}>View Full Order</Link>
              </Button>
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
                <p className="text-muted-foreground">{new Date(customization.created_at).toLocaleString()}</p>
              </div>
              {customization.approved_at && (
                <div className="text-sm">
                  <p className="font-medium">Approved</p>
                  <p className="text-muted-foreground">{new Date(customization.approved_at).toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
