"use client";

import { useState } from "react";
import { managePermissions } from "../actions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PermissionToggles({ 
  userId, 
  userName, 
  initialPermissions 
}: { 
  userId: number; 
  userName: string;
  initialPermissions: { [key: string]: boolean };
}) {
  const [open, setOpen] = useState(false);
  const [perms, setPerms] = useState<{ [key: string]: boolean }>(initialPermissions);

  const toggle = async (module: string, action: string) => {
    const key = `${module.toLowerCase()}:${action}`;
    const newPerms = { ...perms, [key]: !perms[key] };
    
    setPerms(newPerms);
    await managePermissions(userId, newPerms);
  };

  const handleSave = () => {
    setOpen(false);
  };

  const modules = ["Products", "Locations", "Sales", "Tenants"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Modify Security</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Toggles for {userName}</DialogTitle>
        </DialogHeader>

        <div className="pt-4">
          <div className="max-h-[50vh] overflow-y-auto space-y-6 pr-4 pb-4">
            {modules.map(mod => {
              const modLower = mod.toLowerCase();
              return (
                <div key={mod} className="space-y-3">
                  <h4 className="font-medium text-sm text-slate-500 uppercase tracking-wider">{mod}</h4>
                  <div className="flex border rounded-lg p-3 justify-between items-center bg-slate-50">
                    <div className="flex flex-col space-y-1">
                      <Label>Read-Only / Viewer</Label>
                      <span className="text-xs text-slate-400">Can view records but cannot modify.</span>
                    </div>
                    <Switch 
                      checked={perms[`${modLower}:view`] || false} 
                      onCheckedChange={() => toggle(modLower, "view")} 
                    />
                  </div>
                  <div className="flex border rounded-lg p-3 justify-between items-center bg-slate-50">
                    <div className="flex flex-col space-y-1">
                      <Label>Editor privileges</Label>
                      <span className="text-xs text-slate-400">Can create, edit, or delete records.</span>
                    </div>
                    <Switch 
                      checked={perms[`${modLower}:edit`] || false} 
                      onCheckedChange={() => toggle(modLower, "edit")} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <Button className="w-full mt-4" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
