"use client";

import { useState } from "react";
import { updateMember } from "../actions";
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

type UserProps = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
};

export function EditMemberModal({ user }: { user: UserProps }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    const result = await updateMember(user.id, formData);

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
        <Button variant="outline" size="sm">Edit Details</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Member Profiles</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" name="firstName" defaultValue={user.firstName} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" name="lastName" defaultValue={user.lastName} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="roleName">Job Title / Role</Label>
            <Input id="roleName" name="roleName" defaultValue={user.roleName} required />
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
