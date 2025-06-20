"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import AppHeader from "./AppHeader";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: Array<'admin' | 'staff'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.replace("/login");
      } else if (userProfile && !allowedRoles.includes(userProfile.role)) {
        // If role not allowed, redirect to a generic dashboard or login
        // For simplicity, redirecting to login. A better UX might be a "not authorized" page.
        if (userProfile.role === 'admin') router.replace("/admin/products");
        else if (userProfile.role === 'staff') router.replace("/staff/record-sale");
        else router.replace("/login");
      }
    }
  }, [currentUser, userProfile, loading, router, allowedRoles]);

  if (loading || !currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!allowedRoles.includes(userProfile.role)) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <h1 className="text-2xl font-headline mb-4">Not Authorized</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
      </div>
    );
  }


  return <div className="flex flex-col min-h-screen"><AppHeader />{children}</div>;
}

// Example Button, if not already available globally from ui
const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {className?: string}) => (
  <button 
    className={`px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 ${props.className || ''}`}
    {...props}
  >
    {children}
  </button>
);
