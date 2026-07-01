"use client";

import { useState } from "react";
import { createSale } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Banknote } from "lucide-react";
import { DynamicCurrencyDisplay } from "../../products/_components/dynamic-currency";
import { useRegionCurrency } from "@/app/hooks/use-region-currency";

type Option = { id: number; name: string };
type ProductOption = { id: number; name: string; price: number };

export function CreateSaleModal({ locations, products }: { locations: Option[], products: ProductOption[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { currencySymbol } = useRegionCurrency();

  // Auto-calculate total
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
  const estimatedTotal = selectedProduct ? selectedProduct.price * parseFloat(quantity || "0") : 0;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createSale(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setSelectedProductId("");
      setQuantity("1");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
          <Banknote className="w-4 h-4"/> Ring Up Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Point of Sale</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="locationId">Store / Branch Location</Label>
            <select 
              id="locationId" 
              name="locationId" 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Store --</option>
              {locations.map(loc => (
                <option key={`loc-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productId">Product</Label>
            <select 
              id="productId" 
              name="productId" 
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Product --</option>
              {products.map(prod => {
                const formattedPrice = new Intl.NumberFormat(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(prod.price);
                
                return (
                  <option key={`prod-${prod.id}`} value={prod.id}>
                    {prod.name} - {currencySymbol}{formattedPrice}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input 
                id="quantity" 
                name="quantity" 
                type="number" 
                step="1" 
                min="1" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <select 
                id="paymentMethod" 
                name="paymentMethod" 
                required
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
             <div className="p-3 bg-slate-50 border rounded flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Due:</span>
                <span className="text-xl font-bold text-slate-900"><DynamicCurrencyDisplay amount={estimatedTotal} /></span>
             </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">
              {loading ? "Processing..." : "Complete Checkout"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}