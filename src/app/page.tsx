"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (currentUser && userProfile) {
        if (userProfile.role === 'admin') {
          router.replace('/admin/products');
        } else if (userProfile.role === 'staff') {
          router.replace('/staff/record-sale');
        } else {
          // Fallback if role is unknown, though this shouldn't happen
          router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [currentUser, userProfile, loading, router]);

  // Display a loading indicator or a blank page while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}
