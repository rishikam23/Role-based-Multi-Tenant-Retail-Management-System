"use client";

import { useState } from "react";
import { createTenant } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateTenantModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await createTenant(formData);

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
        <Button>Onboard New Tenant</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Client Tenant</DialogTitle>
          <DialogDescription>
            Register a new company to give them access to their own isolated inventory environment.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tenantCode">Unique Tenant Code</Label>
            <Input id="tenantCode" name="tenantCode" required />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
