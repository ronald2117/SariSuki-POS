"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Product } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { PlusCircle, Edit3, Trash2, Image as ImageIcon, AlertTriangle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.preprocess(
    (val) => parseFloat(z.string().parse(val)), // Ensure it's a string before parsing
    z.number().positive("Price must be a positive number")
  ),
  category: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL (e.g., https://placehold.co/200x200.png)").optional().or(z.literal('')),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function AdminProductsPage() {
  const { userProfile, storeId } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (!storeId) return;
    setIsLoading(true);
    const q = query(collection(db, "stores", storeId, "products"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData.sort((a,b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch products." });
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [storeId, toast]);

  const handleAddProduct = () => {
    reset({ name: "", price: 0, category: "", imageUrl: "" });
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setValue("name", product.name);
    setValue("price", product.price);
    setValue("category", product.category || "");
    setValue("imageUrl", product.imageUrl || "");
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (!storeId) return;
    const productData = {
      ...data,
      price: Number(data.price), // ensure price is number
      storeId: storeId,
      updatedAt: serverTimestamp() as Timestamp,
    };

    try {
      if (editingProduct && editingProduct.id) {
        const productRef = doc(db, "stores", storeId, "products", editingProduct.id);
        await updateDoc(productRef, productData);
        toast({ title: "Success", description: "Product updated successfully." });
      } else {
        await addDoc(collection(db, "stores", storeId, "products"), {
          ...productData,
          createdAt: serverTimestamp() as Timestamp,
        });
        toast({ title: "Success", description: "Product added successfully." });
      }
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not save product." });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!storeId) return;
    try {
      await deleteDoc(doc(db, "stores", storeId, "products", productId));
      toast({ title: "Success", description: "Product deleted successfully." });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete product." });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Manage Products</CardTitle>
            <CardDescription>Add, edit, or delete products for your store.</CardDescription>
          </div>
          <Button onClick={handleAddProduct} size="lg">
            <PlusCircle className="mr-2 h-5 w-5" /> Add Product
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-10">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No products yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first product.</p>
              <Button onClick={handleAddProduct} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Image
                        src={product.imageUrl || "https://placehold.co/60x60.png"}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover aspect-square"
                        data-ai-hint="product item"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category || 'N/A'}</TableCell>
                    <TableCell className="text-right">₱{product.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => handleEditProduct(product)}>
                          <Edit3 className="h-4 w-4" />
                           <span className="sr-only">Edit {product.name}</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete {product.name}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the product "{product.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteProduct(product.id!)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update the details of your product." : "Fill in the details to add a new product."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" {...register("name")} className="col-span-3" aria-invalid={errors.name ? "true" : "false"} />
              {errors.name && <p className="col-span-4 text-sm text-destructive text-right">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">Price (₱)</Label>
              <Input id="price" type="number" step="0.01" {...register("price")} className="col-span-3" aria-invalid={errors.price ? "true" : "false"} />
              {errors.price && <p className="col-span-4 text-sm text-destructive text-right">{errors.price.message}</p>}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Input id="category" {...register("category")} className="col-span-3" placeholder="e.g., Snacks, Drinks" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">Image URL</Label>
              <Input id="imageUrl" {...register("imageUrl")} className="col-span-3" placeholder="https://placehold.co/200x200.png" aria-invalid={errors.imageUrl ? "true" : "false"} />
               {errors.imageUrl && <p className="col-span-4 text-sm text-destructive text-right">{errors.imageUrl.message}</p>}
            </div>
             <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (editingProduct ? "Saving..." : "Adding...") : (editingProduct ? "Save Changes" : "Add Product")}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
