"use client";

import { useState } from "react";
import { updateProduct } from "../../actions";
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
import { ProductType } from "@prisma/client";

type ProductProps = {
  id: number;
  sku: string;
  productName: string;
  productType: ProductType;
  sellingPrice: number;
  costPrice: number;
  reorderLevel: number;
  isActive: boolean;
};

export function EditProductModal({ product }: { product: ProductProps }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const isActiveVal = formData.get("isActive") ? "true" : "false";
    formData.set("isActive", isActiveVal);

    const result = await updateProduct(product.id, formData);

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
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Product Details</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="sku">SKU / Barcode</Label>
            <Input id="sku" name="sku" defaultValue={product.sku} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="productName">Product Name</Label>
            <Input id="productName" name="productName" defaultValue={product.productName} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="costPrice">Cost Price</Label>
              <Input id="costPrice" name="costPrice" type="number" step="0.01" defaultValue={product.costPrice} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={product.sellingPrice} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productType">Type</Label>
              <select 
                id="productType" 
                name="productType" 
                defaultValue={product.productType}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="physical">Physical</option>
                <option value="service">Service</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input id="reorderLevel" name="reorderLevel" type="number" defaultValue={product.reorderLevel} />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={product.isActive} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
            <Label htmlFor="isActive">Active Status</Label>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
