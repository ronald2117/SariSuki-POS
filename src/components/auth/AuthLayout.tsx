"use client";
import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Store } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="flex items-center gap-2 mb-6 text-primary hover:text-primary/80 transition-colors">
            <Store className="h-10 w-10" />
            <h1 className="text-3xl font-headline font-bold">SariSuki POS</h1>
          </Link>
        </div>
        <div className="bg-card p-6 sm:p-8 shadow-xl rounded-xl">
            {children}
        </div>
         <p className="text-center text-sm text-muted-foreground">
          SariSuki Point of Sale System
        </p>
      </div>
    </main>
  );
}
