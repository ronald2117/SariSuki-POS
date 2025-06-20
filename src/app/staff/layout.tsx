"use client";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import type { ReactNode } from "react";
import AppHeader from "@/components/layout/AppHeader";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingCart, Settings } from "lucide-react";

const staffNavItems = [
  { href: "/staff/record-sale", label: "Record Sale", icon: ShoppingCart },
  // { href: "/staff/settings", label: "Settings", icon: Settings }, // Example for future expansion
];

export default function StaffLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ProtectedRoute allowedRoles={['staff']}>
       <div className="flex flex-1">
        {/* Mobile-first approach: sidebar might be hidden or different for staff */}
        {/* For simplicity, staff might not need a persistent sidebar like admin */}
        {/* If a sidebar is needed: */}
        {/*
        <aside className="w-64 bg-card border-r p-4 hidden md:flex flex-col space-y-2">
          <nav className="flex flex-col space-y-1">
            {staffNavItems.map((item) => (
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
        */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
