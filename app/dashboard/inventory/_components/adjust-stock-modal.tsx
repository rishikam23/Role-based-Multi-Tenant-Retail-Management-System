"use client";

import { useState } from "react";
import { adjustStock } from "../actions";
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
import { ArrowRightLeft } from "lucide-react";

type Option = { id: number; name: string };

export function AdjustStockModal({ 
  locations, 
  products,
  defaultLocationId,
  defaultProductId
}: { 
  locations: Option[], 
  products: Option[],
  defaultLocationId?: number,
  defaultProductId?: number
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await adjustStock(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <ArrowRightLeft className="w-4 h-4"/> Adjust Stock
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inventory Adjustment</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="adjustmentType">Adjustment Type</Label>
            <select 
              id="adjustmentType" 
              name="adjustmentType" 
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="IN">Stock IN (+)</option>
              <option value="OUT">Stock OUT (-)</option>
              <option value="OPENING">Opening Stock (+)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationId">Target Location</Label>
            <select 
              id="locationId" 
              name="locationId" 
              defaultValue={defaultLocationId}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Location --</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productId">Product / SKU</Label>
            <select 
              id="productId" 
              name="productId" 
              defaultValue={defaultProductId}
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Product --</option>
              {products.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" step="0.0001" min="0.0001" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costPrice">Unit Cost</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" min="0"/>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="batchNo">Batch Number</Label>
            <Input id="batchNo" name="batchNo"/>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Processing Transaction..." : "Confirm Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}