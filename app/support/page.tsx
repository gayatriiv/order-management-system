import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import Link from "next/link"
import { MessageCircle, Mail, Phone, Clock, HelpCircle, Ticket, FileText, User } from "lucide-react"

export default async function SupportPage() {
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Support Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Support Center</h1>
              <p className="text-muted-foreground">Get help with your orders, customizations, and account</p>
            </div>

            {/* Quick Help Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Live Chat</h3>
                  <p className="text-sm text-muted-foreground">Chat with our support team in real-time</p>
                  <Button className="mt-4" size="sm">Start Chat</Button>
                </CardContent>
              </Card>

              <Card className="hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                    <Ticket className="h-6 w-6 text-success" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Raise Ticket</h3>
                  <p className="text-sm text-muted-foreground">Submit a support ticket for complex issues</p>
                  <Button className="mt-4" size="sm" variant="outline">Create Ticket</Button>
                </CardContent>
              </Card>

              <Card className="hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                    <Phone className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Call Support</h3>
                  <p className="text-sm text-muted-foreground">Speak directly with our support team</p>
                  <Button className="mt-4" size="sm" variant="outline">Call Now</Button>
                </CardContent>
              </Card>

              <Card className="hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-warning/20 transition-colors">
                    <Mail className="h-6 w-6 text-warning" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Email Support</h3>
                  <p className="text-sm text-muted-foreground">Send us an email with your questions</p>
                  <Button className="mt-4" size="sm" variant="outline">Send Email</Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Support Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Monday - Friday</span>
                      <span className="text-sm text-muted-foreground">9:00 AM - 6:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Saturday</span>
                      <span className="text-sm text-muted-foreground">10:00 AM - 4:00 PM IST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sunday</span>
                      <span className="text-sm text-muted-foreground">Closed</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      * Emergency support available 24/7 for critical issues
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Your Account Manager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Sarah Johnson</p>
                        <p className="text-sm text-muted-foreground">Account Manager</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>sarah.johnson@company.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>+1 (555) 123-4567</span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message Sarah
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">How do I track my order?</h3>
                    <p className="text-sm text-muted-foreground">
                      You can track your order by going to the "Track Shipments" section in your dashboard. 
                      Enter your AWB number or order ID to get real-time updates.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">How long does customization take?</h3>
                    <p className="text-sm text-muted-foreground">
                      Customization requests typically take 2-5 business days for approval. 
                      Once approved, the customization process takes 3-7 days depending on complexity.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">What file formats do you accept for customizations?</h3>
                    <p className="text-sm text-muted-foreground">
                      We accept JPG, PNG, PDF, AI, and PSD files. Maximum file size is 10MB per file.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">How do I download my invoices?</h3>
                    <p className="text-sm text-muted-foreground">
                      Go to the "Invoices" section in your dashboard. You can filter by date and status, 
                      then download GST-compliant PDF invoices.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                    <p className="text-sm text-muted-foreground">
                      We accept Razorpay (cards, UPI, net banking), direct UPI payments, NEFT transfers, and cheque payments.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Support Tickets */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Recent Support Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Support Requests Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    When you contact support, your requests will appear here for easy tracking
                  </p>
                  <Button>
                    <Ticket className="h-4 w-4 mr-2" />
                    Create Support Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

