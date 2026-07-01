"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCustomer } from "../actions";

export function CreateCustomerModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await createCustomer(fd);
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create customer.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Add Customer</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">New Customer</h2>
              <p className="text-sm text-slate-500 mt-0.5">Add a customer to your organization database.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                <input name="fullName" required placeholder="e.g. Jane Doe" className="h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Email Address</label>
                <input name="email" type="email" placeholder="jane@example.com" className="h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Phone Number</label>
                <input name="phone" type="tel" placeholder="+1 555 000 0000" className="h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Customer"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
