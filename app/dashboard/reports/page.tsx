import Link from "next/link";
import { auth } from "@/auth";
import { getTenantCurrency, formatCurrency } from "./helpers";
import prisma from "@/lib/prisma";
import { FileBarChart, Package, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";

export default async function ReportsIndexPage() {
  const { symbol, tenantId } = await getTenantCurrency();
  if (!tenantId) return <p className="p-8 text-muted-foreground">Unauthorized.</p>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, totalInventoryValue, pendingPOs, lowStockCount] = await Promise.all([
    prisma.salesOrder.aggregate({
      where: { tenantId, status: "confirmed", saleDate: { gte: today } },
      _sum: { grandTotal: true },
      _count: { id: true },
    }),
    prisma.stockLedger.findMany({
      where: { tenantId },
      select: { quantity: true, costPrice: true },
    }),
    prisma.purchaseOrder.count({ where: { tenantId, status: "approved" } }),
    prisma.stockLedger.count({
      where: {
        tenantId,
        quantity: { lte: 0 },
      },
    }),
  ]);

  const totalValue = totalInventoryValue.reduce(
    (sum, row) => sum + Number(row.quantity) * Number(row.costPrice),
    0
  );

  const REPORTS = [
    {
      href: "/dashboard/reports/sales",
      icon: FileBarChart,
      label: "Sales Report",
      desc: "Filter by date, location, and payment method. See cancelled & returned invoices highlighted.",
      stat: formatCurrency(Number(todaySales._sum.grandTotal ?? 0), symbol),
      statLabel: "Today's Revenue",
      color: "from-emerald-500 to-teal-600",
    },
    {
      href: "/dashboard/reports/inventory",
      icon: Package,
      label: "Inventory Report",
      desc: "Real-time stock levels with low-stock & out-of-stock alerts, grouped by location.",
      stat: formatCurrency(totalValue, symbol),
      statLabel: "Total Stock Value",
      color: "from-indigo-500 to-blue-600",
    },
    {
      href: "/dashboard/reports/movements",
      icon: TrendingUp,
      label: "Stock Movement Report",
      desc: "Full audit trail of every inbound, outbound, and internal movement, fully filterable.",
      stat: null,
      statLabel: "Full Audit Trail",
      color: "from-violet-500 to-purple-600",
    },
    {
      href: "/dashboard/reports/purchases",
      icon: ShoppingCart,
      label: "Purchase Orders Report",
      desc: "Track vendor POs from draft through receipt. Filter by supplier, date, and status.",
      stat: pendingPOs > 0 ? `${pendingPOs} pending` : "All clear",
      statLabel: "Awaiting Delivery",
      color: "from-orange-500 to-amber-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          All reports are live — they always reflect the latest data from your database. Use filters to drill down.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {REPORTS.map((report) => {
          const Icon = report.icon;
          return (
            <Link key={report.href} href={report.href} className="group">
              <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-6">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full bg-gradient-to-br ${report.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${report.color} text-white shadow-sm`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{report.label}</h2>
                    <p className="text-sm text-slate-500 mt-1">{report.desc}</p>
                  </div>
                </div>
                {report.stat !== null && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-2xl font-bold text-slate-900">{report.stat}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{report.statLabel}</p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}