"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Product, Sale, SaleItem } from "@/types";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ShoppingCart, PlusCircle, MinusCircle, Trash2, PackageSearch, XCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

interface CartItem extends SaleItem {
  productImageUrl?: string;
}

export default function RecordSalePage() {
  const { userProfile, storeId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!storeId) return;
    setIsLoadingProducts(true);
    const q = query(collection(db, "stores", storeId, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData.sort((a,b) => a.name.localeCompare(b.name)));
      setIsLoadingProducts(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch products." });
      setIsLoadingProducts(false);
    });
    return () => unsubscribe();
  }, [storeId, toast]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item
        );
      } else {
        return [...prevCart, {
          productId: product.id!,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          totalPrice: product.price,
          productImageUrl: product.imageUrl
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart(prevCart => {
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.productId !== productId);
      }
      return prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice } : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  }, [cart]);

  const handleRecordSale = async () => {
    if (cart.length === 0 || !storeId || !userProfile?.uid) {
      toast({ variant: "destructive", title: "Error", description: "Cart is empty or user/store info missing." });
      return;
    }
    setIsSubmittingSale(true);
    const saleData: Omit<Sale, 'id'> = {
      storeId: storeId,
      staffId: userProfile.uid,
      staffName: userProfile.displayName || userProfile.email || 'Unknown Staff',
      items: cart.map(({productImageUrl, ...item}) => item), // Remove image URL from sale items
      totalAmount: cartTotal,
      timestamp: serverTimestamp() as Timestamp,
    };

    try {
      await addDoc(collection(db, "stores", storeId, "sales"), saleData);
      toast({ title: "Success", description: "Sale recorded successfully." });
      setCart([]); // Clear cart
    } catch (error) {
      console.error("Error recording sale:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not record sale." });
    } finally {
      setIsSubmittingSale(false);
    }
  };

  return (
    <div className="container mx-auto py-8 h-full flex flex-col lg:flex-row gap-6">
      {/* Products Section */}
      <div className="lg:w-3/5 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Select Products</CardTitle>
            <div className="relative mt-2">
              <PackageSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search products..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoadingProducts ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-10 h-full flex flex-col justify-center items-center">
                <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">No products found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {searchTerm ? "Try adjusting your search." : "No products available in this store."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <Card 
                      key={product.id} 
                      onClick={() => addToCart(product)} 
                      className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
                      role="button"
                      aria-label={`Add ${product.name} to cart`}
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && addToCart(product)}
                    >
                      <div className="aspect-square w-full overflow-hidden">
                        <Image
                          src={product.imageUrl || "https://placehold.co/200x200.png"}
                          alt={product.name}
                          width={200}
                          height={200}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          data-ai-hint="product image"
                        />
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{product.category || 'Uncategorized'}</p>
                        <p className="font-bold text-sm mt-1 text-primary">₱{product.price.toFixed(2)}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="lg:w-2/5 flex flex-col">
        <Card className="flex-1 flex flex-col shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" /> Current Sale
            </CardTitle>
            <CardDescription>Review items and complete the sale.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full p-4 sm:p-6">
              {cart.length === 0 ? (
                <div className="text-center py-10 h-full flex flex-col justify-center items-center">
                  <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Your cart is empty. Add products to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg">
                      <Image
                        src={item.productImageUrl || "https://placehold.co/60x60.png"}
                        alt={item.productName}
                        width={60}
                        height={60}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="cart item"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.productName}</h4>
                        <p className="text-xs text-muted-foreground">₱{item.unitPrice.toFixed(2)} each</p>
                         <div className="flex items-center gap-2 mt-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label={`Decrease quantity of ${item.productName}`}>
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <Input 
                            type="number" 
                            value={item.quantity} 
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                            className="h-7 w-12 text-center px-1"
                            min="0"
                            aria-label={`Quantity of ${item.productName}`}
                          />
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label={`Increase quantity of ${item.productName}`}>
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">₱{item.totalPrice.toFixed(2)}</p>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80" onClick={() => removeFromCart(item.productId)} aria-label={`Remove ${item.productName} from cart`}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          {cart.length > 0 && (
            <CardFooter className="flex-col items-stretch p-4 sm:p-6 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold font-headline text-primary">₱{cartTotal.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full" 
                onClick={handleRecordSale} 
                disabled={isSubmittingSale || cart.length === 0}
              >
                {isSubmittingSale ? "Processing..." : "Complete Sale"}
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}

