"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { processReturn } from "../actions";
import { formatCurrency } from "../../reports/helpers";

interface SaleOption {
  id: number;
  invoiceNo: string;
  grandTotal: number;
}

interface NewReturnModalProps {
  sales: SaleOption[];
  symbol: string;
}

export function NewReturnModal({ sales, symbol }: NewReturnModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      await processReturn(fd);
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to process return.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Process Return</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Process Sales Return</h2>
              <p className="text-sm text-slate-500 mt-0.5">Select the original invoice and enter refund details.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Original Invoice *</label>
                <select name="salesOrderId" required className="h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select an invoice...</option>
                  {sales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.invoiceNo} — {formatCurrency(s.grandTotal, symbol)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Refund Amount *</label>
                <input name="totalRefunded" type="number" step="0.01" min="0" required placeholder="0.00" className="h-9 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Return Reason</label>
                <textarea name="returnReason" rows={3} placeholder="Describe why the customer is returning the item..." className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? "Processing..." : "Submit Return"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
