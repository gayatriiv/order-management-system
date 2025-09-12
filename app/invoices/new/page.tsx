"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface Order {
  id: string
  order_number: string
  customer_name: string
  total_amount: number
  tax_amount: number
  shipping_amount: number
  discount_amount: number
}

interface PaymentTerm {
  id: string
  name: string
  days: number
}

export default function NewInvoicePage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([])
  const [selectedOrder, setSelectedOrder] = useState("")
  const [selectedPaymentTerms, setSelectedPaymentTerms] = useState("Net 30")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [notes, setNotes] = useState("")
  const [termsConditions, setTermsConditions] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load orders that don't have invoices yet
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        total_amount,
        tax_amount,
        shipping_amount,
        discount_amount,
        customers (company_name, contact_name)
      `)
      .in("status", ["confirmed", "in_production", "ready_to_ship", "shipped", "delivered"])

    if (ordersData) {
      // Filter out orders that already have invoices
      const { data: existingInvoices } = await supabase.from("invoices").select("order_id")

      const invoicedOrderIds = new Set(existingInvoices?.map((inv) => inv.order_id) || [])

      const availableOrders = ordersData
        .filter((order) => !invoicedOrderIds.has(order.id))
        .map((order: any) => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: `${order.customers.company_name} - ${order.customers.contact_name}`,
          total_amount: order.total_amount || 0,
          tax_amount: order.tax_amount || 0,
          shipping_amount: order.shipping_amount || 0,
          discount_amount: order.discount_amount || 0,
        }))

      setOrders(availableOrders)
    }

    // Load payment terms
    const { data: termsData } = await supabase.from("payment_terms").select("*").eq("is_active", true).order("days")

    if (termsData) setPaymentTerms(termsData)
  }

  const selectedOrderData = orders.find((o) => o.id === selectedOrder)

  const calculateDueDate = () => {
    const term = paymentTerms.find((t) => t.name === selectedPaymentTerms)
    if (!term) return ""

    const issue = new Date(issueDate)
    const due = new Date(issue.getTime() + term.days * 24 * 60 * 60 * 1000)
    return due.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) {
      setError("Please select an order")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Use the database function to generate invoice
      const { data: result, error: invoiceError } = await supabase.rpc("generate_invoice_from_order", {
        order_uuid: selectedOrder,
      })

      if (invoiceError) throw invoiceError

      // Update the invoice with custom fields
      const { error: updateError } = await supabase
        .from("invoices")
        .update({
          payment_terms: selectedPaymentTerms,
          issue_date: issueDate,
          due_date: calculateDueDate(),
          notes: notes || null,
          terms_conditions: termsConditions || null,
        })
        .eq("id", result)

      if (updateError) throw updateError

      router.push(`/invoices/${result}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
        <p className="text-muted-foreground">Generate an invoice from an existing order</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="order">Order</Label>
              <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order to invoice" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      Order #{order.order_number} - {order.customer_name} (${order.total_amount})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrderData && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span>Subtotal:</span>
                  <span>
                    $
                    {(
                      selectedOrderData.total_amount -
                      selectedOrderData.tax_amount -
                      selectedOrderData.shipping_amount +
                      selectedOrderData.discount_amount
                    ).toFixed(2)}
                  </span>
                  <span>Tax:</span>
                  <span>${selectedOrderData.tax_amount.toFixed(2)}</span>
                  <span>Shipping:</span>
                  <span>${selectedOrderData.shipping_amount.toFixed(2)}</span>
                  <span>Discount:</span>
                  <span>-${selectedOrderData.discount_amount.toFixed(2)}</span>
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold">${selectedOrderData.total_amount.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select value={selectedPaymentTerms} onValueChange={setSelectedPaymentTerms}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTerms.map((term) => (
                      <SelectItem key={term.id} value={term.name}>
                        {term.name} ({term.days} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {calculateDueDate() && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Due Date:</strong> {new Date(calculateDueDate()).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Invoice notes or special instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="termsConditions">Terms & Conditions</Label>
              <Textarea
                id="termsConditions"
                placeholder="Payment terms and conditions"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Invoice"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
