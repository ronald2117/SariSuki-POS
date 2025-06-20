"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import type { Sale, SaleItem } from "@/types";
import { collection, query, where, onSnapshot, Timestamp, orderBy, startOfDay, endOfDay } from "firebase/firestore";
import { BarChartBig, DollarSign, CalendarDays } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { DatePickerWithRange } from "@/components/ui/date-range-picker"; // Assuming this component exists or will be created
import type { DateRange } from "react-day-picker";


// Placeholder for DatePickerWithRange - You'll need to implement or import this from shadcn/ui if available
// For now, I'll create a simplified version here.
// If you have `DatePickerWithRange` from `shadcn/ui` or similar, replace this.
const DatePickerPlaceholder = ({ onDateChange, dateRange }: { onDateChange: (range: DateRange | undefined) => void, dateRange: DateRange | undefined }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(dateRange?.from);

  const handleDateSelect = (day: Date | undefined) => {
    setSelectedDate(day);
    if (day) {
      onDateChange({ from: startOfDay(day), to: endOfDay(day) });
    } else {
      onDateChange(undefined);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-5 w-5 text-muted-foreground" />
      <input 
        type="date" 
        value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
        onChange={(e) => handleDateSelect(e.target.value ? new Date(e.target.value) : undefined)}
        className="p-2 border rounded-md bg-card text-card-foreground"
      />
       {selectedDate && <button onClick={() => handleDateSelect(undefined)} className="text-sm text-primary hover:underline">Clear</button>}
    </div>
  );
};


export default function AdminSalesPage() {
  const { storeId } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });

  useEffect(() => {
    if (!storeId || !dateRange?.from) return;
    setIsLoading(true);

    const salesCollectionRef = collection(db, "stores", storeId, "sales");
    
    let q = query(salesCollectionRef, orderBy("timestamp", "desc"));

    if (dateRange.from) {
        q = query(q, where("timestamp", ">=", Timestamp.fromDate(startOfDay(dateRange.from))));
    }
    if (dateRange.to) {
         q = query(q, where("timestamp", "<=", Timestamp.fromDate(endOfDay(dateRange.to))));
    }


    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const salesData: Sale[] = [];
      querySnapshot.forEach((doc) => {
        salesData.push({ id: doc.id, ...doc.data() } as Sale);
      });
      setSales(salesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching sales:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not fetch sales data." });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [storeId, dateRange, toast]);

  const totalSalesForPeriod = useMemo(() => {
    return sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  }, [sales]);

  const totalItemsSold = useMemo(() => {
    return sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  }, [sales]);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="font-headline text-2xl">Sales Reports</CardTitle>
              <CardDescription>View sales transactions for your store.</CardDescription>
            </div>
            <DatePickerPlaceholder dateRange={dateRange} onDateChange={setDateRange} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{totalSalesForPeriod.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue for the selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
                <BarChartBig className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItemsSold}</div>
                <p className="text-xs text-muted-foreground">
                  Total items sold in the selected period
                </p>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
             <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-10">
              <BarChartBig className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No sales data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no sales recorded for the selected period.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date / Time</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.timestamp ? format(sale.timestamp.toDate(), 'PPpp') : 'N/A'}
                    </TableCell>
                    <TableCell>{sale.staffName || sale.staffId.substring(0,8) || 'N/A'}</TableCell>
                    <TableCell>
                      <ul>
                        {sale.items.map((item, index) => (
                          <li key={index} className="text-xs">
                            {item.productName} (x{item.quantity}) - ₱{(item.unitPrice * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                    <TableCell className="text-right font-medium">₱{sale.totalAmount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
