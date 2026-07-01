"use client";

import { useState } from "react";
import { createUnit } from "../actions";
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
import { Plus } from "lucide-react";

export function CreateUnitModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createUnit(formData);

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
        <Button className="flex items-center gap-2"><Plus className="w-4 h-4"/> Add UoM</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Define Unit of Measure</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="uomCode">Unit Code</Label>
            <Input id="uomCode" name="uomCode" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="uomName">Full Name</Label>
            <Input id="uomName" name="uomName" required />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Registering..." : "Save Unit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}