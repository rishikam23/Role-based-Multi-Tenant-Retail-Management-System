"use client";

import { useState } from "react";
import { createPO } from "../actions";
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
import { ShoppingCart } from "lucide-react";

type Option = { id: number; name: string };

export function CreatePOModal({ suppliers, locations, products }: { suppliers: Option[], locations: Option[], products: Option[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createPO(formData);

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
          <ShoppingCart className="w-4 h-4" /> Create Purchase Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Draft Purchase Order</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div className="grid gap-2">
            <Label htmlFor="supplierId">Vendor / Supplier</Label>
            <select
              id="supplierId"
              name="supplierId"
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Supplier --</option>
              {suppliers.map(sup => (
                <option key={`sup-${sup.id}`} value={sup.id}>{sup.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationId">Delivering At</Label>
            <select
              id="locationId"
              name="locationId"
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Delivery Location --</option>
              {locations.map(loc => (
                <option key={`loc-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productId">Product to Order</Label>
            <select
              id="productId"
              name="productId"
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Product --</option>
              {products.map(prod => (
                <option key={`prod-${prod.id}`} value={prod.id}>{prod.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Order Quantity</Label>
              <Input id="quantity" name="quantity" type="number" step="0.0001" min="0.0001" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unitCost">Unit Cost</Label>
              <Input id="unitCost" name="unitCost" type="number" step="0.01" min="0" required />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Drafting PO..." : "Save Draft PO"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}