"use client";

import { useState } from "react";
import { updateUnit } from "../actions";
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

type UnitProps = {
  id: number;
  uomCode: string;
  uomName: string;
  isActive: boolean;
};

export function EditUnitModal({ unit }: { unit: UnitProps }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const isActiveVal = formData.get("isActive") ? "true" : "false";
    formData.set("isActive", isActiveVal);

    const result = await updateUnit(unit.id, formData);

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
          <DialogTitle>Edit Unit of Measure</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="uomCode">Unit Code</Label>
            <Input id="uomCode" name="uomCode" defaultValue={unit.uomCode} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="uomName">Full Name</Label>
            <Input id="uomName" name="uomName" defaultValue={unit.uomName} required />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={unit.isActive} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
            <Label htmlFor="isActive">Active Unit Status</Label>
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