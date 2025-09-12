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

interface OrderItem {
  id: string
  order_id: string
  product_name: string
  order_number: string
  customer_name: string
}

export default function NewCustomizationPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [selectedOrderItem, setSelectedOrderItem] = useState("")
  const [requestType, setRequestType] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [estimatedCost, setEstimatedCost] = useState("")
  const [estimatedDays, setEstimatedDays] = useState("")
  const [specifications, setSpecifications] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadOrderItems()
  }, [])

  const loadOrderItems = async () => {
    const supabase = createClient()

    // Get order items from orders that can be customized
    const { data } = await supabase
      .from("order_items")
      .select(`
        id,
        orders (
          id,
          order_number,
          customers (company_name, contact_name)
        ),
        products (name, is_customizable)
      `)
      .eq("products.is_customizable", true)
      .eq("status", "pending")

    if (data) {
      const formattedItems = data.map((item: any) => ({
        id: item.id,
        order_id: item.orders.id,
        product_name: item.products.name,
        order_number: item.orders.order_number,
        customer_name: `${item.orders.customers.company_name} - ${item.orders.customers.contact_name}`,
      }))
      setOrderItems(formattedItems)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrderItem || !requestType || !title || !description) {
      setError("Please fill in all required fields")
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

      // Parse specifications as JSON if provided
      let specsJson = null
      if (specifications.trim()) {
        try {
          specsJson = JSON.parse(specifications)
        } catch {
          // If not valid JSON, store as simple object
          specsJson = { notes: specifications }
        }
      }

      // Create customization request
      const { data: customization, error: customizationError } = await supabase
        .from("customization_requests")
        .insert({
          order_item_id: selectedOrderItem,
          request_type: requestType,
          title,
          description,
          specifications: specsJson,
          priority,
          estimated_cost: estimatedCost ? Number.parseFloat(estimatedCost) : 0,
          estimated_days: estimatedDays ? Number.parseInt(estimatedDays) : 0,
          requested_by: user.id,
        })
        .select()
        .single()

      if (customizationError) throw customizationError

      // Create default workflow steps
      const workflowSteps = [
        { step_name: "Initial Review", step_order: 1 },
        { step_name: "Design Phase", step_order: 2 },
        { step_name: "Approval", step_order: 3 },
        { step_name: "Production Setup", step_order: 4 },
      ]

      const { error: stepsError } = await supabase.from("customization_workflow_steps").insert(
        workflowSteps.map((step) => ({
          customization_request_id: customization.id,
          ...step,
        })),
      )

      if (stepsError) throw stepsError

      router.push(`/customizations/${customization.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">New Customization Request</h1>
        <p className="text-muted-foreground">Create a new customization request for a product</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customization Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="orderItem">Order Item *</Label>
              <Select value={selectedOrderItem} onValueChange={setSelectedOrderItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an order item to customize" />
                </SelectTrigger>
                <SelectContent>
                  {orderItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.product_name} - Order #{item.order_number} ({item.customer_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestType">Request Type *</Label>
                <Select value={requestType} onValueChange={setRequestType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Design Modification</SelectItem>
                    <SelectItem value="material">Material Change</SelectItem>
                    <SelectItem value="size">Size Adjustment</SelectItem>
                    <SelectItem value="color">Color Change</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                type="text"
                placeholder="Brief title for the customization"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the customization requirements"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="specifications">Technical Specifications (JSON format)</Label>
              <Textarea
                id="specifications"
                placeholder='{"dimensions": "10x20cm", "material": "steel", "finish": "matte"}'
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedCost">Estimated Additional Cost ($)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estimatedDays">Estimated Additional Days</Label>
                <Input
                  id="estimatedDays"
                  type="number"
                  min="0"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Request"}
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
