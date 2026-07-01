"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import { NewCashUpForm } from "./new-cashup-form";

type Option = { id: number; name: string };

export function NewCashUpModal({ locations }: { locations: Option[] }) {
  const [open, setOpen] = useState(false);

  function handleSuccess() {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all duration-200">
          <Calculator className="w-4 h-4" /> EOD Cash Up
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
            End of Day Register Closing
          </DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <NewCashUpForm locations={locations} onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
