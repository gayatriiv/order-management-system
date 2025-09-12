"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  FileText,
  Truck,
  CreditCard,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SidebarProps {
  userRole: string
  isCollapsed?: boolean
  onToggle?: () => void
}

const navigationItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: TrendingUp,
    roles: ["admin", "sales", "ops", "finance", "client"],
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    roles: ["admin", "sales", "ops", "finance", "client"],
    badge: "12",
  },
  {
    title: "Customizations",
    href: "/customizations",
    icon: Wrench,
    roles: ["admin", "sales", "ops", "client"],
    badge: "3",
  },
  {
    title: "Customers",
    href: "/customizations", // Placeholder - should be /customers
    icon: Users,
    roles: ["admin", "sales"],
  },
  {
    title: "Products",
    href: "/products",
    icon: Package,
    roles: ["admin", "ops"],
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    roles: ["admin", "ops", "finance"],
  },
  {
    title: "Fulfillment",
    href: "/fulfillment",
    icon: Truck,
    roles: ["admin", "ops"],
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
    roles: ["admin", "finance"],
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: FileText,
    roles: ["admin", "finance", "client"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    roles: ["admin", "sales", "ops", "finance"],
  },
]

export function Sidebar({ userRole, isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const filteredItems = navigationItems.filter(item => 
    item.roles.includes(userRole)
  )

  return (
    <div className={cn(
      "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">OMS</h1>
              <p className="text-xs text-muted-foreground">Order Management</p>
            </div>
          </div>
        )}
        
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover-lift"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "nav-item group relative",
                isActive && "active",
                isCollapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
              )} />
              
              {!isCollapsed && (
                <>
                  <span className={cn(
                    "truncate",
                    isActive ? "text-primary-foreground" : "text-sidebar-foreground group-hover:text-accent-foreground"
                  )}>
                    {item.title}
                  </span>
                  
                  {item.badge && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs px-2 py-0.5 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.title}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <Link
          href="/settings"
          className={cn(
            "nav-item group",
            isCollapsed && "justify-center px-2"
          )}
        >
          <Settings className={cn(
            "h-5 w-5 flex-shrink-0",
            "text-muted-foreground group-hover:text-accent-foreground"
          )} />
          {!isCollapsed && (
            <span className="truncate text-sidebar-foreground group-hover:text-accent-foreground">
              Settings
            </span>
          )}
        </Link>
      </div>
    </div>
  )
}
