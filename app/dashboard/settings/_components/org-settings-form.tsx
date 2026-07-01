"use client";

import { useTransition, useState } from "react";
import { updateOrgSettings } from "../actions";

export function OrgSettingsForm({ children, canEdit }: { children: React.ReactNode; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);

    startTransition(() => {
      updateOrgSettings(formData).then((result) => {
        if (result.error) {
          setMessage({ type: "error", text: result.error });
        } else {
          setMessage({
            type: "success",
            text: `Settings saved! Currency symbol auto-set to: ${result.currencySymbol}`,
          });
        }
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            message.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700"
          }`}
        >
          {message.type === "success" ? "Success" : "Failed"}{message.text}
        </div>
      )}

      {children}

      {canEdit && (
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Saving..." : "Save Organisation Settings"}
          </button>
        </div>
      )}
    </form>
  );
}