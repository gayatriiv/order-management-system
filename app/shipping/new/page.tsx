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
  customer_address: string
  customer_city: string
  customer_state: string
  customer_zip: string
}

interface Carrier {
  id: string
  name: string
  code: string
  supported_services: string[]
}

export default function NewShipmentPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [carriers, setCarriers] = useState<Carrier[]>([])
  const [selectedOrder, setSelectedOrder] = useState("")
  const [selectedCarrier, setSelectedCarrier] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [weight, setWeight] = useState("")
  const [length, setLength] = useState("")
  const [width, setWidth] = useState("")
  const [height, setHeight] = useState("")
  const [declaredValue, setDeclaredValue] = useState("")
  const [shippingCost, setShippingCost] = useState("")
  const [specialInstructions, setSpecialInstructions] = useState("")
  const [estimatedDelivery, setEstimatedDelivery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load orders ready to ship
    const { data: ordersData } = await supabase
      .from("orders")
      .select(`
        id,
        order_number,
        customers (
          company_name,
          contact_name,
          address,
          city,
          state,
          zip_code
        )
      `)
      .in("status", ["confirmed", "in_production", "ready_to_ship"])

    if (ordersData) {
      const formattedOrders = ordersData.map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: `${order.customers.company_name} - ${order.customers.contact_name}`,
        customer_address: order.customers.address || "",
        customer_city: order.customers.city || "",
        customer_state: order.customers.state || "",
        customer_zip: order.customers.zip_code || "",
      }))
      setOrders(formattedOrders)
    }

    // Load carriers
    const { data: carriersData } = await supabase
      .from("shipping_carriers")
      .select("*")
      .eq("is_active", true)
      .order("name")

    if (carriersData) setCarriers(carriersData)
  }

  const selectedCarrierData = carriers.find((c) => c.id === selectedCarrier)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder || !selectedCarrier) {
      setError("Please select an order and carrier")
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

      // Get order and customer details
      const selectedOrderData = orders.find((o) => o.id === selectedOrder)
      if (!selectedOrderData) throw new Error("Order not found")

      // Generate shipment number
      const shipmentNumber = `SHP-${Date.now()}`

      // Create shipment
      const { data: shipment, error: shipmentError } = await supabase
        .from("shipments")
        .insert({
          order_id: selectedOrder,
          shipment_number: shipmentNumber,
          carrier_id: selectedCarrier,
          service_type: serviceType || null,
          tracking_number: trackingNumber || null,
          ship_to_name: selectedOrderData.customer_name.split(" - ")[1] || selectedOrderData.customer_name,
          ship_to_company: selectedOrderData.customer_name.split(" - ")[0] || "",
          ship_to_address: selectedOrderData.customer_address,
          ship_to_city: selectedOrderData.customer_city,
          ship_to_state: selectedOrderData.customer_state,
          ship_to_zip: selectedOrderData.customer_zip,
          ship_from_name: "Warehouse Team",
          ship_from_company: "Your Company",
          ship_from_address: "123 Warehouse St",
          ship_from_city: "Warehouse City",
          ship_from_state: "CA",
          ship_from_zip: "90210",
          weight_lbs: weight ? Number.parseFloat(weight) : null,
          length_in: length ? Number.parseFloat(length) : null,
          width_in: width ? Number.parseFloat(width) : null,
          height_in: height ? Number.parseFloat(height) : null,
          declared_value: declaredValue ? Number.parseFloat(declaredValue) : null,
          shipping_cost: shippingCost ? Number.parseFloat(shippingCost) : 0,
          estimated_delivery_date: estimatedDelivery ? new Date(estimatedDelivery).toISOString() : null,
          special_instructions: specialInstructions || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (shipmentError) throw shipmentError

      // Update order status to shipped if tracking number provided
      if (trackingNumber) {
        await supabase
          .from("orders")
          .update({
            status: "shipped",
            shipped_date: new Date().toISOString(),
          })
          .eq("id", selectedOrder)
      }

      router.push(`/shipping/${shipment.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Shipment</h1>
        <p className="text-muted-foreground">Create a shipment for an order</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order">Order</Label>
                <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order to ship" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.order_number} - {order.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="carrier">Shipping Carrier</Label>
                <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((carrier) => (
                      <SelectItem key={carrier.id} value={carrier.id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceType">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedCarrierData?.supported_services?.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service.charAt(0).toUpperCase() + service.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="trackingNumber">Tracking Number</Label>
                <Input
                  id="trackingNumber"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="estimatedDelivery">Estimated Delivery Date</Label>
              <Input
                id="estimatedDelivery"
                type="date"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Package Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (lbs)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="declaredValue">Declared Value ($)</Label>
                <Input
                  id="declaredValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="shippingCost">Shipping Cost ($)</Label>
                <Input
                  id="shippingCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special handling or delivery instructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Shipment"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
