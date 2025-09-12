import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Plus, TrendingUp, TrendingDown, RotateCcw } from "lucide-react"

export default async function InventoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !["admin", "ops", "finance"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Get recent inventory transactions
  const { data: transactions } = await supabase
    .from("inventory_transactions")
    .select(`
      *,
      products (name, sku),
      profiles (full_name)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get products with low stock
  const { data: lowStockProducts } = await supabase
    .from("products")
    .select("*")
    .lte("stock_quantity", "min_stock_level")
    .order("stock_quantity")

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "in":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "out":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "adjustment":
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "in":
        return "text-green-600"
      case "out":
        return "text-red-600"
      case "adjustment":
        return "text-blue-600"
      default:
        return "text-muted-foreground"
    }
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
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
            Products
          </Link>
          <Link
            href="/inventory"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Inventory
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground">Track stock levels and inventory movements</p>
          </div>
          {(profile.role === "admin" || profile.role === "ops") && (
            <Button asChild>
              <Link href="/inventory/adjust">
                <Plus className="h-4 w-4 mr-2" />
                Stock Adjustment
              </Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Low Stock Products
                {lowStockProducts && lowStockProducts.length > 0 && (
                  <Badge variant="destructive">{lowStockProducts.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts && lowStockProducts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">{product.stock_quantity} left</p>
                        <p className="text-xs text-muted-foreground">Min: {product.min_stock_level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">All products are adequately stocked</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Inventory Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium">{transaction.products?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            by {transaction.profiles?.full_name || "System"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${getTransactionColor(transaction.transaction_type)}`}>
                          {transaction.transaction_type === "out" ? "-" : "+"}
                          {transaction.quantity}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
