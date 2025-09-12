import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, Edit, AlertTriangle, Package } from "lucide-react"

export default async function ProductsPage() {
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

  // Get products with stock information
  const { data: products } = await supabase.from("products").select("*").order("name")

  const getStockStatus = (stock: number, minLevel: number) => {
    if (stock === 0) return { label: "Out of Stock", variant: "destructive" as const }
    if (stock <= minLevel) return { label: "Low Stock", variant: "default" as const }
    return { label: "In Stock", variant: "default" as const }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r">
        <div className="p-6">
          <h2 className="text-lg font-semibold">OMS Dashboard</h2>
          <p className="text-sm text-muted-foreground">{profile.full_name}</p>
          <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
        </div>
        <nav className="px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Dashboard
          </Link>
          <Link href="/orders" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Orders
          </Link>
          {(profile.role === "admin" || profile.role === "sales") && (
            <Link href="/customers" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
              Customers
            </Link>
          )}
          {(profile.role === "admin" || profile.role === "ops") && (
            <Link
              href="/products"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
            >
              <Package className="h-4 w-4" />
              Products
            </Link>
          )}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Products & Inventory</h1>
            <p className="text-muted-foreground">Manage products and track inventory levels</p>
          </div>
          {(profile.role === "admin" || profile.role === "ops") && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/inventory">
                  <Package className="h-4 w-4 mr-2" />
                  Inventory
                </Link>
              </Button>
              <Button asChild>
                <Link href="/products/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Product
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        {products && products.some((p) => p.stock_quantity <= p.min_stock_level) && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700">
                {products.filter((p) => p.stock_quantity <= p.min_stock_level).length} products are running low on
                stock.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
          </CardHeader>
          <CardContent>
            {products && products.length > 0 ? (
              <div className="space-y-4">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level)
                  return (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            {product.category && (
                              <p className="text-xs text-muted-foreground">Category: {product.category}</p>
                            )}
                          </div>
                          <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                          {product.is_customizable && <Badge variant="outline">Customizable</Badge>}
                        </div>
                        <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                          <span>Price: ${product.base_price}</span>
                          <span>Stock: {product.stock_quantity}</span>
                          <span>Min Level: {product.min_stock_level}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(profile.role === "admin" || profile.role === "ops") && (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/products/${product.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No products found</p>
                {(profile.role === "admin" || profile.role === "ops") && (
                  <Button asChild className="mt-4">
                    <Link href="/products/new">Add your first product</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
