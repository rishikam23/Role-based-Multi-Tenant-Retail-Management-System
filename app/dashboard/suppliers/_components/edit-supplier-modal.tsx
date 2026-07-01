"use client";

import { useState } from "react";
import { updateSupplier } from "../actions";
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

type SupplierProps = {
  id: number;
  supplierName: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export function EditSupplierModal({ supplier }: { supplier: SupplierProps }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const isActiveVal = formData.get("isActive") ? "true" : "false";
    formData.set("isActive", isActiveVal);

    const result = await updateSupplier(supplier.id, formData);

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
          <DialogTitle>Edit Supplier Details</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

          <div className="grid gap-2">
            <Label htmlFor="supplierName">Company / Supplier Name</Label>
            <Input id="supplierName" name="supplierName" defaultValue={supplier.supplierName} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="contactPerson">Contact Person</Label>
            <Input id="contactPerson" name="contactPerson" defaultValue={supplier.contactPerson || ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" defaultValue={supplier.email || ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" defaultValue={supplier.phone || ""} />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={supplier.isActive} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
            <Label htmlFor="isActive">Active Supplier Status</Label>
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