"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db } from "@/lib/firebase";
import type { Store, UserProfile } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { useToast } from "@/hooks/use-toast";

const adminRegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
  storeName: z.string().min(3, { message: "Store name must be at least 3 characters." }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminRegisterFormValues = z.infer<typeof adminRegisterSchema>;

// Basic UUID generator
function generateUUID() { 
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
}


export default function AdminRegisterPage() {
  const router = useRouter();
  const { setAuthLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminRegisterFormValues>({
    resolver: zodResolver(adminRegisterSchema),
  });

  const onSubmit = async (data: AdminRegisterFormValues) => {
    setError(null);
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      if (user) {
        const storeId = generateUUID().slice(0, 8); // Short, somewhat unique ID

        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          role: 'admin',
          storeId: storeId,
          storeName: data.storeName,
        };
        
        const newStore: Store = {
          name: data.storeName,
          adminUid: user.uid,
          createdAt: serverTimestamp() as any, // Firestore will convert this
        };

        const batch = writeBatch(db);
        const userDocRef = doc(db, "users", user.uid);
        batch.set(userDocRef, userProfile);
        const storeDocRef = doc(db, "stores", storeId);
        batch.set(storeDocRef, newStore);
        
        await batch.commit();

        toast({ title: "Registration Successful!", description: `Your store "${data.storeName}" has been created. Your Store ID is ${storeId}. Please save it.` });
        router.push('/login'); // Redirect to login after successful registration
      }
    } catch (err: any) {
      let message = "Failed to register. Please try again.";
      if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      }
      setError(message);
      toast({ variant: "destructive", title: "Registration Failed", description: message });
      console.error("Admin registration error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">Create Admin Account & Store</CardTitle>
          <CardDescription className="text-center">Register as an admin and set up your store.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name</Label>
              <Input id="storeName" placeholder="My Awesome Store" {...register("storeName")} aria-invalid={errors.storeName ? "true" : "false"} />
              {errors.storeName && <p className="text-sm text-destructive">{errors.storeName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" {...register("email")} aria-invalid={errors.email ? "true" : "false"} />
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
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register & Create Store"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Button variant="link" asChild><Link href="/login">Log In</Link></Button>
          </p>
           <p className="text-sm text-muted-foreground">
            Registering as staff? <Button variant="link" asChild><Link href="/register/staff">Staff Registration</Link></Button>
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
