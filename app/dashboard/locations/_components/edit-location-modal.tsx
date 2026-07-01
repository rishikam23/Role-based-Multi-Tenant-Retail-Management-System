"use client";

import { useState } from "react";
import { updateLocation } from "../../actions";
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
import { LocationType } from "@prisma/client";

type LocationProps = {
  id: number;
  locationCode: string;
  locationName: string;
  locationType: LocationType;
  isActive: boolean;
};

export function EditLocationModal({ location }: { location: LocationProps }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const isActiveVal = formData.get("isActive") ? "true" : "false";
    formData.set("isActive", isActiveVal);

    const result = await updateLocation(location.id, formData);

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
          <DialogTitle>Edit Location</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="locationCode">Location Code</Label>
            <Input id="locationCode" name="locationCode" defaultValue={location.locationCode} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationName">Location Name</Label>
            <Input id="locationName" name="locationName" defaultValue={location.locationName} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="locationType">Type</Label>
            <select 
              id="locationType" 
              name="locationType" 
              defaultValue={location.locationType}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="store">Store</option>
              <option value="branch">Branch</option>
              <option value="depot">Depot</option>
              <option value="kiosk">Kiosk</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="isActive" name="isActive" defaultChecked={location.isActive} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
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
