"use client";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import type { ReactNode } from "react";
import AppHeader from "@/components/layout/AppHeader";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Package, BarChartBig, Users, Settings } from "lucide-react";

const adminNavItems = [
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/sales", label: "Sales Reports", icon: BarChartBig },
  // { href: "/admin/staff", label: "Manage Staff", icon: Users },
  // { href: "/admin/settings", label: "Store Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="flex flex-1">
        <aside className="w-64 bg-card border-r p-4 hidden md:flex flex-col space-y-2">
          <nav className="flex flex-col space-y-1">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10",
                  pathname === item.href && "bg-primary/10 text-primary font-medium"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
