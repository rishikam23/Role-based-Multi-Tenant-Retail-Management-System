"use client";

import { useState } from "react";
import { createTransfer } from "../actions";
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

export function CreateTransferModal({ locations, products }: { locations: Option[], products: Option[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createTransfer(formData);

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
          <ArrowRightLeft className="w-4 h-4"/> Create Transfer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initiate Stock Transfer</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="fromLocationId">Dispatching From</Label>
            <select 
              id="fromLocationId" 
              name="fromLocationId" 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Source --</option>
              {locations.map(loc => (
                <option key={`from-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="toLocationId">Receiving At</Label>
            <select 
              id="toLocationId" 
              name="toLocationId" 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Destination --</option>
              {locations.map(loc => (
                <option key={`to-${loc.id}`} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productId">Product to Transfer</Label>
            <select 
              id="productId" 
              name="productId" 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            >
              <option value="">-- Select Product --</option>
              {products.map(prod => (
                <option key={prod.id} value={prod.id}>{prod.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity to Transfer</Label>
            <Input id="quantity" name="quantity" type="number" step="0.0001" min="0.0001" required />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating Draft..." : "Save Draft Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}