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
import { TrendingUp } from "lucide-react";

const MOVEMENT_LABELS: Record<string, string> = {
  purchase_receipt: "Purchase Receipt",
  sale: "Sale",
  adjustment_in: "Adjustment In",
  adjustment_out: "Adjustment Out",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
  return_from_customer: "Customer Return",
  return_to_supplier: "Supplier Return",
  opening_stock: "Opening Stock",
};

const MOVEMENT_COLORS: Record<string, string> = {
  sale: "text-red-600 bg-red-50",
  adjustment_out: "text-red-600 bg-red-50",
  transfer_out: "text-orange-600 bg-orange-50",
  return_to_supplier: "text-orange-600 bg-orange-50",
  purchase_receipt: "text-emerald-700 bg-emerald-50",
  adjustment_in: "text-emerald-700 bg-emerald-50",
  transfer_in: "text-blue-700 bg-blue-50",
  return_from_customer: "text-blue-700 bg-blue-50",
  opening_stock: "text-indigo-700 bg-indigo-50",
};

export default async function StockMovementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; location?: string; type?: string; product?: string }>;
}) {
  const params = await searchParams;
  const { symbol, tenantId } = await getTenantCurrency();
  if (!tenantId) return <p className="p-8 text-muted-foreground">Unauthorized.</p>;

  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(new Date(params.to).setHours(23, 59, 59, 999)) : undefined;
  const locationId = params.location ? parseInt(params.location) : undefined;
  const movementType = params.type as string | undefined;
  const productId = params.product ? parseInt(params.product) : undefined;

  const whereClause: any = { tenantId };
  if (fromDate || toDate) {
    whereClause.performedAt = {};
    if (fromDate) whereClause.performedAt.gte = fromDate;
    if (toDate) whereClause.performedAt.lte = toDate;
  }
  if (movementType && movementType !== "all") whereClause.movementType = movementType;
  if (productId) whereClause.productId = productId;
  if (locationId) {
    whereClause.OR = [{ fromLocationId: locationId }, { toLocationId: locationId }];
  }

  const [movements, locations, products] = await Promise.all([
    prisma.stockMovement.findMany({
      where: whereClause,
      include: {
        product: { select: { productName: true, sku: true } },
        fromLocation: { select: { locationName: true } },
        toLocation: { select: { locationName: true } },
        performedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { performedAt: "desc" },
      take: 100,
    }),
    prisma.location.findMany({ where: { tenantId, isActive: true }, select: { id: true, locationName: true }, orderBy: { locationName: "asc" } }),
    prisma.product.findMany({ where: { tenantId, isActive: true }, select: { id: true, productName: true, sku: true }, orderBy: { productName: "asc" } }),
  ]);

  const movementTypes = Object.keys(MOVEMENT_LABELS);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movement Report</h1>
          <p className="text-muted-foreground">Full audit trail of every inventory movement.</p>
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
          <label className="text-xs font-medium text-slate-500">Location</label>
          <select name="location" defaultValue={params.location ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Locations</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.locationName}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Movement Type</label>
          <select name="type" defaultValue={params.type ?? "all"} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="all">All Types</option>
            {movementTypes.map((t) => <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Product</label>
          <select name="product" defaultValue={params.product ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Products</option>
            {products.map((p) => <option key={p.id} value={p.id}>[{p.sku}] {p.productName}</option>)}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Apply</button>
        <a href="/dashboard/reports/movements" className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-slate-50">Clear</a>
      </form>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No movements found for the selected filters.</TableCell>
              </TableRow>
            ) : (
              movements.map((m, idx) => {
                const qty = Number(m.quantity);
                const colorClass = MOVEMENT_COLORS[m.movementType] ?? "text-slate-600 bg-slate-50";
                return (
                  <TableRow key={m.id}>
                    <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="text-slate-500 text-sm">{new Date(m.performedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
                        {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{m.product.productName}</div>
                      <div className="text-xs text-slate-400 font-mono">{m.product.sku}</div>
                    </TableCell>
                    <TableCell className="text-slate-500">{m.fromLocation?.locationName ?? "—"}</TableCell>
                    <TableCell className="text-slate-500">{m.toLocation?.locationName ?? "—"}</TableCell>
                    <TableCell className={`text-right font-bold ${qty < 0 ? "text-red-600" : "text-emerald-600"}`}>
                      {qty > 0 ? "+" : ""}{qty.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{m.referenceType ?? "—"} {m.referenceId ? `#${m.referenceId}` : ""}</TableCell>
                    <TableCell className="text-sm text-slate-600">{m.performedBy.firstName} {m.performedBy.lastName}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="px-4 py-2 border-t text-xs text-slate-400">{movements.length} records shown (max 100).</div>
      </div>
    </div>
  );
}
