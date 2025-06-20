"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const staffRegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  storeId: z.string().min(1, { message: "Store ID is required." }),
  displayName: z.string().min(2, { message: "Name must be at least 2 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type StaffRegisterFormValues = z.infer<typeof staffRegisterSchema>;

export default function StaffRegisterPage() {
  const router = useRouter();
  const { setAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StaffRegisterFormValues>({
    resolver: zodResolver(staffRegisterSchema),
  });

  const onSubmit = async (data: StaffRegisterFormValues) => {
    setError(null);
    setAuthLoading(true);
    try {
      // Check if storeId exists
      const storeDocRef = doc(db, "stores", data.storeId);
      const storeDocSnap = await getDoc(storeDocRef);

      if (!storeDocSnap.exists()) {
        setError("Invalid Store ID. Please check with your store admin.");
        toast({ variant: "destructive", title: "Registration Failed", description: "Invalid Store ID." });
        setAuthLoading(false);
        return;
      }
      const storeData = storeDocSnap.data();

      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          displayName: data.displayName,
          role: 'staff',
          storeId: data.storeId,
          storeName: storeData?.name || 'Unknown Store' // Get store name from store doc
        };
        
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, userProfile);
        
        toast({ title: "Registration Successful!", description: "Your staff account has been created." });
        router.push('/login'); // Redirect to login after successful registration
      }
    } catch (err: any) {
      let message = "Failed to register. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      }
      setError(message);
      toast({ variant: "destructive", title: "Registration Failed", description: message });
      console.error("Staff registration error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Staff Registration</CardTitle>
          <CardDescription className="text-center">Register as a staff member for an existing store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Full Name</Label>
              <Input id="displayName" placeholder="Juan Dela Cruz" {...register("displayName")} aria-invalid={errors.displayName ? "true" : "false"} />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="staff@example.com" {...register("email")} aria-invalid={errors.email ? "true" : "false"} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} aria-invalid={errors.password ? "true" : "false"} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
             <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" {...register("confirmPassword")} aria-invalid={errors.confirmPassword ? "true" : "false"} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="storeId">Store ID</Label>
              <Input id="storeId" placeholder="Enter Store ID provided by Admin" {...register("storeId")} aria-invalid={errors.storeId ? "true" : "false"} />
              {errors.storeId && <p className="text-sm text-destructive">{errors.storeId.message}</p>}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register as Staff"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Button variant="link" asChild><Link href="/login">Log In</Link></Button>
          </p>
           <p className="text-sm text-muted-foreground">
            Registering as admin? <Button variant="link" asChild><Link href="/register/admin">Admin Registration</Link></Button>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
