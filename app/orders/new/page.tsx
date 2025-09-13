"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Topbar } from "@/components/layout/topbar"
import { Sidebar } from "@/components/layout/sidebar"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Plus, Trash2, Search, Filter, Upload, Eye, ArrowRight, CheckCircle, Package, Truck, CreditCard } from "lucide-react"

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
  description?: string
  category?: string
  stock_quantity?: number
}

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
}

interface User {
  id: string
  email: string
  full_name?: string
  role: string
}

export default function NewOrderPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [notes, setNotes] = useState("")
  const [requiredDate, setRequiredDate] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [shippingMethod, setShippingMethod] = useState("standard")
  const [paymentMethod, setPaymentMethod] = useState("razorpay")
  const router = useRouter()

  const totalSteps = 4

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) setUser(user)

    // Load products with more details
    const { data: productsData } = await supabase
      .from("products")
      .select("id, name, sku, base_price, description, category, stock_quantity")
      .eq("is_active", true)
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStockStatus = (product: Product) => {
    if (!product.stock_quantity) return { status: "unknown", color: "gray" }
    if (product.stock_quantity > 10) return { status: "in-stock", color: "green" }
    if (product.stock_quantity > 0) return { status: "low-stock", color: "yellow" }
    return { status: "out-of-stock", color: "red" }
  }

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      setError("Please add at least one item to your order")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      if (!user) throw new Error("Not authenticated")

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id, // Client places order for themselves
          total_amount: calculateTotal(),
          required_date: requiredDate || null,
          notes,
          shipping_method: shippingMethod,
          payment_method: paymentMethod,
          created_by: user.id,
          status: "pending",
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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole="client" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <Topbar user={user} />

        {/* Order Placement Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Place New Order</h1>
              <p className="text-muted-foreground">Create a new order with product selection and customization options</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'border-muted-foreground text-muted-foreground'
                    }`}>
                      {currentStep > step ? <CheckCircle className="h-5 w-5" /> : step}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step === 1 && 'Products'}
                      {step === 2 && 'Customization'}
                      {step === 3 && 'Review'}
                      {step === 4 && 'Payment'}
                    </span>
                    {step < 4 && (
                      <div className={`w-12 h-0.5 mx-4 ${
                        currentStep > step ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <Progress value={(currentStep / totalSteps) * 100} className="mt-4" />
            </div>

            {/* Step 1: Product Selection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Search and Filters */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex gap-4 mb-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="clothing">Clothing</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product)
                    const isInCart = orderItems.some(item => item.product_id === product.id)
                    
                    return (
                      <Card key={product.id} className="hover-lift">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-3">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                stockStatus.status === 'in-stock' ? 'border-green-500 text-green-700' :
                                stockStatus.status === 'low-stock' ? 'border-yellow-500 text-yellow-700' :
                                'border-red-500 text-red-700'
                              }`}
                            >
                              {stockStatus.status.replace('-', ' ')}
                            </Badge>
                            <span className="text-sm text-muted-foreground">SKU: {product.sku}</span>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          {product.description && (
                            <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl font-bold">${product.base_price.toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const existingItem = orderItems.find(item => item.product_id === product.id)
                                  if (existingItem) {
                                    updateOrderItem(orderItems.indexOf(existingItem), "quantity", existingItem.quantity + 1)
                                  } else {
                                    setOrderItems([...orderItems, {
                                      product_id: product.id,
                                      quantity: 1,
                                      unit_price: product.base_price,
                                      total_price: product.base_price
                                    }])
                                  }
                                }}
                                disabled={stockStatus.status === 'out-of-stock'}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Selected Items */}
                {orderItems.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Selected Items ({orderItems.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {orderItems.map((item, index) => {
                          const product = products.find(p => p.id === item.product_id)
                          return (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{product?.name}</p>
                                <p className="text-sm text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateOrderItem(index, "quantity", Math.max(1, item.quantity - 1))}
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center">{item.quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateOrderItem(index, "quantity", item.quantity + 1)}
                                  >
                                    +
                                  </Button>
                                </div>
                                <span className="font-semibold w-20 text-right">${item.total_price.toFixed(2)}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeOrderItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                        <div className="flex justify-between items-center pt-3 border-t">
                          <span className="text-lg font-semibold">Total: ${calculateTotal().toFixed(2)}</span>
                          <Button onClick={nextStep} disabled={orderItems.length === 0}>
                            Continue to Customization
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 2: Customization */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Customization (Optional)</CardTitle>
                  <p className="text-muted-foreground">Upload logos, artwork, or messages for your products</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Upload Customization Files</h3>
                    <p className="text-muted-foreground mb-4">Drag and drop your logo, artwork, or message files here</p>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">Supports: JPG, PNG, PDF, AI, PSD (Max 10MB)</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Back to Products
                    </Button>
                    <Button onClick={nextStep}>
                      Continue to Review
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label>Required Date</Label>
                        <Input
                          type="date"
                          value={requiredDate}
                          onChange={(e) => setRequiredDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Shipping Method</Label>
                        <Select value={shippingMethod} onValueChange={setShippingMethod}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard (5-7 days)</SelectItem>
                            <SelectItem value="express">Express (2-3 days)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Special Instructions</Label>
                      <Textarea
                        placeholder="Any special instructions or notes for this order..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-3">Order Summary</h3>
                      {orderItems.map((item, index) => {
                        const product = products.find(p => p.id === item.product_id)
                        return (
                          <div key={index} className="flex justify-between items-center py-2">
                            <span>{product?.name} x {item.quantity}</span>
                            <span>${item.total_price.toFixed(2)}</span>
                          </div>
                        )
                      })}
                      <div className="flex justify-between items-center py-2 border-t font-semibold">
                        <span>Total</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={prevStep}>
                        Back to Customization
                      </Button>
                      <Button onClick={nextStep}>
                        Continue to Payment
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment & Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="razorpay">Razorpay (Cards, UPI, Net Banking)</SelectItem>
                        <SelectItem value="upi">UPI Payment</SelectItem>
                        <SelectItem value="neft">NEFT Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Final Order Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${calculateTotal().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{shippingMethod === 'express' ? '$15.00' : '$8.00'}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${(calculateTotal() + (shippingMethod === 'express' ? 15 : 8)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Back to Review
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                      {isLoading ? "Creating Order..." : "Confirm & Place Order"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-red-700">{error}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
