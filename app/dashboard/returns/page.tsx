import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTenantCurrency, formatCurrency } from "../reports/helpers";
import { NewReturnModal } from "./_components/new-return-modal";
import { approveReturn, rejectReturn } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { RotateCcw } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  approved:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected:  "bg-red-50 text-red-700 border-red-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
};

export default async function ReturnsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  if (!tenantId) redirect("/dashboard");

  const { symbol } = await getTenantCurrency();

  const [returns, eligibleSales] = await Promise.all([
    prisma.salesReturn.findMany({
      where: { tenantId },
      include: {
        salesOrder: { select: { invoiceNo: true, grandTotal: true } },
        processedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    // Only confirmed sales (not already fully returned) are eligible for new returns
    prisma.salesOrder.findMany({
      where: { tenantId, status: { in: ["confirmed", "partially_returned"] } },
      select: { id: true, invoiceNo: true, grandTotal: true },
      orderBy: { saleDate: "desc" },
      take: 200,
    }),
  ]);

  const totalRefunded = returns
    .filter((r) => r.status === "approved" || r.status === "completed")
    .reduce((sum, r) => sum + Number(r.totalRefunded), 0);

  const pendingCount = returns.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-7 w-7 text-orange-500" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Returns</h1>
            <p className="text-muted-foreground">Process and manage customer return requests.</p>
          </div>
        </div>
        <NewReturnModal
          sales={eligibleSales.map((s) => ({ id: s.id, invoiceNo: s.invoiceNo, grandTotal: Number(s.grandTotal) }))}
          symbol={symbol}
        />
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Returns", value: returns.length, color: "text-slate-700" },
          { label: "Pending Approval", value: pendingCount, color: pendingCount > 0 ? "text-amber-600" : "text-slate-600" },
          { label: "Total Refunded", value: formatCurrency(totalRefunded, symbol), color: "text-red-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return No.</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Processed By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Refunded</TableHead>
              {isSuper && <TableHead className="text-right w-[160px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isSuper ? 8 : 7} className="text-center py-12 text-muted-foreground">
                  No returns processed yet.
                </TableCell>
              </TableRow>
            ) : (
              returns.map((ret) => (
                <TableRow key={ret.id}>
                  <TableCell className="font-mono font-bold text-slate-700 text-sm">{ret.returnNo}</TableCell>
                  <TableCell className="text-indigo-600 font-medium">{ret.salesOrder.invoiceNo}</TableCell>
                  <TableCell className="text-slate-500 text-sm max-w-[200px] truncate">
                    {ret.returnReason || <span className="italic text-slate-400">No reason provided</span>}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {ret.processedBy.firstName} {ret.processedBy.lastName}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(ret.returnDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full border ${STATUS_STYLES[ret.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {ret.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    {formatCurrency(Number(ret.totalRefunded), symbol)}
                  </TableCell>
                  {isSuper && (
                    <TableCell className="text-right">
                      {ret.status === "pending" && (
                        <div className="flex justify-end gap-2">
                          <form action={async () => { "use server"; await approveReturn(ret.id); }}>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
                          </form>
                          <form action={async () => { "use server"; await rejectReturn(ret.id); }}>
                            <Button size="sm" variant="destructive">Reject</Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
