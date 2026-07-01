"use client";

import { useState } from "react";
import { createProduct } from "../../actions";
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

import { useRegionCurrency } from "@/app/hooks/use-region-currency";

export function CreateProductModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { currencySymbol } = useRegionCurrency();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createProduct(formData);

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
        <Button>Add Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Catalog Item</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productType">Type</Label>
              <select id="productType" name="productType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" required>
                <option value="physical">Physical</option>
                <option value="service">Service</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" name="productName" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="costPrice">Unit Cost ({currencySymbol || "$"})</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue="0" min="0" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling Price ({currencySymbol || "$"})</Label>
              <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue="0" min="0" required />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
