"use client";

import { useState } from "react";
import { updatePersonalSettings } from "../actions";
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
import { Settings } from "lucide-react";

export function PersonalSettingsModal({ currentUsername }: { currentUsername: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    setSuccess(false);

    const result = await updatePersonalSettings(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
          <Settings className="w-4 h-4" />
          User Settings
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Personal Security Settings</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 pt-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 p-3 rounded">Settings updated successfully!</p>}
          
          <div className="grid gap-2">
            <Label htmlFor="username">Login Username / Email</Label>
            <Input id="username" name="username" defaultValue={currentUsername} required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">New Password</Label>
            <Input id="password" name="password" type="password"/>
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Configuration"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}