import prisma from "@/lib/prisma";
import { getTenantCurrency, formatCurrency } from "../helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart } from "lucide-react";

export default async function PurchasesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; supplier?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { symbol, tenantId } = await getTenantCurrency();
  if (!tenantId) return <p className="p-8 text-muted-foreground">Unauthorized.</p>;

  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(new Date(params.to).setHours(23, 59, 59, 999)) : undefined;
  const supplierId = params.supplier ? parseInt(params.supplier) : undefined;
  const statusFilter = params.status as string | undefined;

  const whereClause: any = { tenantId };
  if (fromDate || toDate) {
    whereClause.orderDate = {};
    if (fromDate) whereClause.orderDate.gte = fromDate;
    if (toDate) whereClause.orderDate.lte = toDate;
  }
  if (supplierId) whereClause.supplierId = supplierId;
  if (statusFilter && statusFilter !== "all") whereClause.status = statusFilter;

  const [orders, suppliers] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where: whereClause,
      include: {
        supplier: true,
        receivingLocation: true,
        items: { include: { product: { select: { productName: true, sku: true } } } },
      },
      orderBy: { orderDate: "desc" },
      take: 100,
    }),
    prisma.supplier.findMany({ where: { tenantId, isActive: true }, select: { id: true, supplierName: true }, orderBy: { supplierName: "asc" } }),
  ]);

  const totalValue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.grandTotal), 0);
  const receivedCount = orders.filter((o) => o.status === "received").length;
  const pendingCount = orders.filter((o) => o.status === "approved").length;
  const draftCount = orders.filter((o) => o.status === "draft").length;

  const STATUS_COLORS: Record<string, string> = {
    draft: "bg-slate-100 text-slate-600",
    submitted: "bg-yellow-50 text-yellow-700",
    approved: "bg-blue-50 text-blue-700",
    partially_received: "bg-purple-50 text-purple-700",
    received: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShoppingCart className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders Report</h1>
          <p className="text-muted-foreground">Track all vendor purchase orders and receipts.</p>
        </div>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-xl border shadow-sm">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">From Date</label>
          <input type="date" name="from" defaultValue={params.from ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">To Date</label>
          <input type="date" name="to" defaultValue={params.to ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm" />
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Supplier</label>
          <select name="supplier" defaultValue={params.supplier ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Suppliers</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <select name="status" defaultValue={params.status ?? "all"} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            {["all", "draft", "approved", "received", "cancelled"].map((s) => (
              <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Apply</button>
        <a href="/dashboard/reports/purchases" className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-slate-50">Clear</a>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total PO Value", value: formatCurrency(totalValue, symbol), color: "text-indigo-600" },
          { label: "Received", value: receivedCount, color: "text-emerald-600" },
          { label: "Pending Delivery", value: pendingCount, color: "text-blue-600" },
          { label: "Drafts", value: draftCount, color: "text-slate-500" },
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
              <TableHead>#</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Delivery Location</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No purchase orders found.</TableCell>
              </TableRow>
            ) : (
              orders.map((po, idx) => (
                <TableRow key={po.id}>
                  <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-bold text-slate-700">{po.poNumber}</TableCell>
                  <TableCell className="text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-indigo-600">{po.supplier.supplierName}</TableCell>
                  <TableCell>{po.receivingLocation.locationName}</TableCell>
                  <TableCell>
                    {po.items.map((item) => (
                      <div key={item.id} className="text-xs text-slate-600">
                        {item.product.productName} × {Number(item.orderedQty)} @ {formatCurrency(Number(item.unitCost), symbol)}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[po.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {po.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-indigo-700">
                    {formatCurrency(Number(po.grandTotal), symbol)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="px-4 py-2 border-t text-xs text-slate-400">{orders.length} records shown.</div>
      </div>
    </div>
  );
}