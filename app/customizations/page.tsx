import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import Link from "next/link"
import { Plus, Eye, Clock, CheckCircle, XCircle, AlertCircle, Upload, FileText, Image, MessageSquare } from "lucide-react"

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

  // Get client's customization requests only
  const { data: customizations } = await supabase
    .from("customization_requests")
    .select(`
      *,
      order_items (
        *,
        orders (
          order_number,
          customer_id
        ),
        products (name, sku)
      )
    `)
    .eq("customer_id", user.id)
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Customization Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">Customization Requests</h1>
                <p className="text-muted-foreground">Manage your customization requests and track their approval status</p>
              </div>
              <Button asChild>
                <Link href="/customizations/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Link>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{customizations?.filter(c => c.status === 'pending').length || 0}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Under Review</p>
                      <p className="text-2xl font-bold">{customizations?.filter(c => c.status === 'under_review').length || 0}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Approved</p>
                      <p className="text-2xl font-bold">{customizations?.filter(c => c.status === 'approved').length || 0}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="hover-lift">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                      <p className="text-2xl font-bold">{customizations?.length || 0}</p>
                    </div>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customization Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle>Your Customization Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {customizations && customizations.length > 0 ? (
                  <div className="space-y-4">
                    {customizations.map((customization) => (
                      <div key={customization.id} className="border rounded-lg p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{customization.title || 'Customization Request'}</h3>
                              <Badge variant={getStatusColor(customization.status)}>
                                {getStatusIcon(customization.status)}
                                <span className="ml-1 capitalize">{customization.status.replace("_", " ")}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              For: {customization.order_items?.products?.name} - Order #{customization.order_items?.orders?.order_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Request ID: #{customization.id.slice(0, 8)} • Created: {new Date(customization.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/customizations/${customization.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>

                        {/* Request Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Type: {customization.request_type || 'General'}</span>
                          </div>
                          {customization.estimated_cost > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">Est. Cost: ${customization.estimated_cost}</span>
                            </div>
                          )}
                          {customization.estimated_days > 0 && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Est. Days: {customization.estimated_days}</span>
                            </div>
                          )}
                        </div>

                        {/* Files Uploaded */}
                        {customization.attachments && customization.attachments.length > 0 && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Files Uploaded:</p>
                            <div className="flex flex-wrap gap-2">
                              {customization.attachments.map((file: any, index: number) => (
                                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm">
                                  <Image className="h-4 w-4" />
                                  <span>{file.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Messages */}
                        {customization.message && (
                          <div className="border-t pt-4">
                            <p className="text-sm font-medium mb-2">Your Message:</p>
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <p className="text-sm text-muted-foreground">{customization.message}</p>
                            </div>
                          </div>
                        )}

                        {/* Admin Response */}
                        {customization.admin_response && (
                          <div className="border-t pt-4 mt-4">
                            <p className="text-sm font-medium mb-2">Admin Response:</p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <p className="text-sm">{customization.admin_response}</p>
                              {customization.updated_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Updated: {new Date(customization.updated_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Re-submit Button for Rejected Requests */}
                        {customization.status === 'rejected' && (
                          <div className="border-t pt-4 mt-4">
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Re-submit Files
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Customization Requests Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Upload logos, artwork, or messages for your products to get started
                    </p>
                    <Button asChild>
                      <Link href="/customizations/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Request
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
