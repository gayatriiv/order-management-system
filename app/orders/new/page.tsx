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
import { Plus, Trash2 } from "lucide-react"

interface Customer {
  id: string
  company_name: string
  contact_name: string
}

interface Product {
  id: string
  name: string
  sku: string
  base_price: number
}

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
}

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [requiredDate, setRequiredDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Load customers
    const { data: customersData } = await supabase.from("customers").select("id, company_name, contact_name")
    if (customersData) setCustomers(customersData)

    // Load products
    const { data: productsData } = await supabase.from("products").select("id, name, sku, base_price")
    if (productsData) setProducts(productsData)
  }

  const addOrderItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: 1, unit_price: 0, total_price: 0 }])
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...orderItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Auto-calculate prices
    if (field === "product_id") {
      const product = products.find((p) => p.id === value)
      if (product) {
        updatedItems[index].unit_price = product.base_price
        updatedItems[index].total_price = product.base_price * updatedItems[index].quantity
      }
    } else if (field === "quantity" || field === "unit_price") {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price
    }

    setOrderItems(updatedItems)
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer || orderItems.length === 0) {
      setError("Please select a customer and add at least one item")
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

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: selectedCustomer,
          total_amount: calculateTotal(),
          required_date: requiredDate || null,
          notes,
          created_by: user.id,
          status: "draft",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItemsData = orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItemsData)

      if (itemsError) throw itemsError

      router.push(`/orders/${order.id}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Order</h1>
        <p className="text-muted-foreground">Add a new order to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.company_name} - {customer.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="requiredDate">Required Date</Label>
                <Input
                  id="requiredDate"
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Order notes or special instructions"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Order Items</CardTitle>
            <Button type="button" onClick={addOrderItem} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
            {orderItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No items added yet</p>
            ) : (
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 border rounded-lg">
                    <div className="md:col-span-2">
                      <Label>Product</Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => updateOrderItem(index, "product_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ${product.base_price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, "quantity", Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateOrderItem(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <Label>Total</Label>
                      <Input type="text" value={`$${item.total_price.toFixed(2)}`} disabled />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => removeOrderItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="text-right">
                  <p className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
