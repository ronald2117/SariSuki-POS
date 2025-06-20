"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  storeId: z.string().min(1, { message: "Store ID is required." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { fetchUserProfile, setAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    setAuthLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        const userProfile = await fetchUserProfile(user.uid);
        if (userProfile && userProfile.storeId === data.storeId) {
          // User profile exists and storeId matches
          if (userProfile.role === "admin") {
            router.push("/admin/products");
          } else if (userProfile.role === "staff") {
            router.push("/staff/record-sale");
          } else {
            setError("Unknown user role.");
            toast({ variant: "destructive", title: "Login Error", description: "Unknown user role." });
          }
        } else if (userProfile && userProfile.storeId !== data.storeId) {
          setError("Store ID does not match your profile. Please check and try again.");
          toast({ variant: "destructive", title: "Login Error", description: "Store ID mismatch." });
        } 
        else {
          setError("User profile not found or incomplete. Please contact support.");
           toast({ variant: "destructive", title: "Login Error", description: "User profile issue." });
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "Failed to log in. Please check your credentials.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "Invalid email or password.";
      }
      setError(message);
      toast({ variant: "destructive", title: "Login Failed", description: message });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Welcome Back!</CardTitle>
          <CardDescription className="text-center">Log in to your SariSuki POS account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" {...register("email")} aria-invalid={errors.email ? "true" : "false"} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} aria-invalid={errors.password ? "true" : "false"} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeId">Store ID</Label>
              <Input id="storeId" type="text" placeholder="Your Store ID" {...register("storeId")} aria-invalid={errors.storeId ? "true" : "false"} />
              {errors.storeId && <p className="text-sm text-destructive">{errors.storeId.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?
          </p>
          <div className="space-x-2">
             <Button variant="link" asChild><Link href="/register/admin">Register as Admin</Link></Button>
             <span className="text-muted-foreground">|</span>
             <Button variant="link" asChild><Link href="/register/staff">Register as Staff</Link></Button>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
