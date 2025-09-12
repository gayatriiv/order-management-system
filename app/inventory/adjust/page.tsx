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

interface Product {
  id: string
  name: string
  sku: string
  stock_quantity: number
}

export default function StockAdjustmentPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState("")
  const [transactionType, setTransactionType] = useState("in")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("products").select("id, name, sku, stock_quantity").order("name")
    if (data) setProducts(data)
  }

  const selectedProductData = products.find((p) => p.id === selectedProduct)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct || !quantity) {
      setError("Please select a product and enter quantity")
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

      // Create inventory transaction
      const { error: transactionError } = await supabase.from("inventory_transactions").insert({
        product_id: selectedProduct,
        transaction_type: transactionType,
        quantity: Number.parseInt(quantity),
        reference_type: "adjustment",
        notes: notes || null,
        created_by: user.id,
      })

      if (transactionError) throw transactionError

      router.push("/inventory")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Stock Adjustment</h1>
        <p className="text-muted-foreground">Adjust inventory levels for products</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.sku} (Current: {product.stock_quantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProductData && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Current Stock:</strong> {selectedProductData.stock_quantity} units
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In (Add)</SelectItem>
                    <SelectItem value="out">Stock Out (Remove)</SelectItem>
                    <SelectItem value="adjustment">Adjustment (Set to)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">{transactionType === "adjustment" ? "New Stock Level" : "Quantity"}</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>

            {selectedProductData && quantity && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Result:</strong>{" "}
                  {transactionType === "adjustment"
                    ? `Stock will be set to ${quantity}`
                    : transactionType === "in"
                      ? `Stock will increase to ${selectedProductData.stock_quantity + Number.parseInt(quantity || "0")}`
                      : `Stock will decrease to ${Math.max(0, selectedProductData.stock_quantity - Number.parseInt(quantity || "0"))}`}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Reason for adjustment (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processing..." : "Submit Adjustment"}
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
