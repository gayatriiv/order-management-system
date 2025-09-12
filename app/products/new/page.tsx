"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function NewProductPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [sku, setSku] = useState("")
  const [basePrice, setBasePrice] = useState("")
  const [category, setCategory] = useState("")
  const [isCustomizable, setIsCustomizable] = useState(false)
  const [stockQuantity, setStockQuantity] = useState("")
  const [minStockLevel, setMinStockLevel] = useState("10")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !sku || !basePrice) {
      setError("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error: productError } = await supabase.from("products").insert({
        name,
        description: description || null,
        sku,
        base_price: Number.parseFloat(basePrice),
        category: category || null,
        is_customizable: isCustomizable,
        stock_quantity: Number.parseInt(stockQuantity) || 0,
        min_stock_level: Number.parseInt(minStockLevel) || 10,
      })

      if (productError) throw productError

      router.push("/products")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="text-muted-foreground">Create a new product in the inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sku">SKU *</Label>
                <Input id="sku" type="text" required value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Base Price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stockQuantity">Initial Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={minStockLevel}
                  onChange={(e) => setMinStockLevel(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isCustomizable"
                checked={isCustomizable}
                onCheckedChange={(checked) => setIsCustomizable(checked as boolean)}
              />
              <Label htmlFor="isCustomizable">This product is customizable</Label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Product"}
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
