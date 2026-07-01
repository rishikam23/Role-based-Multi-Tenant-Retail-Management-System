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
import { Package } from "lucide-react";
import { InventoryDistributionChart } from "../_components/inventory-distribution-chart";

export default async function InventoryReportPage({
  searchParams,
}: {
  searchParams: Promise<{ location?: string; category?: string; product?: string; low_stock?: string }>;
}) {
  const params = await searchParams;
  const { symbol, tenantId } = await getTenantCurrency();
  if (!tenantId) return <p className="p-8 text-muted-foreground">Unauthorized.</p>;

  const locationId = params.location ? parseInt(params.location) : undefined;
  const categoryId = params.category ? parseInt(params.category) : undefined;
  const productId = params.product ? parseInt(params.product) : undefined;
  const lowStockOnly = params.low_stock === "1";

  const ledgerWhere: any = { tenantId };
  if (locationId) ledgerWhere.locationId = locationId;
  if (productId) ledgerWhere.productId = productId;
  else if (categoryId) {
    ledgerWhere.product = { categoryId };
  }

  const [ledger, locations, categories] = await Promise.all([
    prisma.stockLedger.findMany({
      where: ledgerWhere,
      include: {
        location: true,
        product: {
          include: { category: { select: { categoryName: true } }, uom: { select: { uomCode: true } } },
        },
      },
      orderBy: [{ location: { locationName: "asc" } }, { product: { productName: "asc" } }],
    }),
    prisma.location.findMany({ where: { tenantId, isActive: true }, select: { id: true, locationName: true }, orderBy: { locationName: "asc" } }),
    prisma.category.findMany({ where: { tenantId, isActive: true }, select: { id: true, categoryName: true }, orderBy: { categoryName: "asc" } }),
  ]);

  const filtered = lowStockOnly
    ? ledger.filter((e) => Number(e.quantity) <= e.product.reorderLevel)
    : ledger;
  const totalSKUs = new Set(filtered.map((e) => e.productId)).size;
  const totalValue = filtered.reduce((sum, e) => sum + Number(e.quantity) * Number(e.costPrice), 0);
  const lowStockCount = ledger.filter((e) => Number(e.quantity) <= e.product.reorderLevel).length;
  const zeroStockCount = ledger.filter((e) => Number(e.quantity) === 0).length;

  // Group stock ledgers by location for visual distribution chart
  const locationGroups: { [key: string]: number } = {};
  filtered.forEach((item) => {
    const locName = item.location.locationName;
    const val = Number(item.quantity) * Number(item.costPrice);
    locationGroups[locName] = (locationGroups[locName] || 0) + val;
  });

  const distributionData = Object.entries(locationGroups).map(([locationName, totalValue]) => ({
    locationName,
    totalValue,
  })).sort((a, b) => b.totalValue - a.totalValue);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Report</h1>
          <p className="text-muted-foreground">Real-time stock levels across all locations.</p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-xl border shadow-sm">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Location</label>
          <select name="location" defaultValue={params.location ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Locations</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.locationName}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Category</label>
          <select name="category" defaultValue={params.category ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <input type="checkbox" name="low_stock" value="1" defaultChecked={lowStockOnly} className="rounded" />
            <span>Low Stock Only</span>
          </label>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Apply</button>
        <a href="/dashboard/reports/inventory" className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-slate-50">Clear</a>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Unique SKUs", value: totalSKUs, color: "text-indigo-600 font-bold" },
              { label: "Low Stock Items", value: lowStockCount, color: lowStockCount > 0 ? "text-orange-500 font-bold" : "text-slate-600 font-bold" },
              { label: "Out of Stock", value: zeroStockCount, color: zeroStockCount > 0 ? "text-red-600 font-bold" : "text-slate-600 font-bold" },
              { label: "Total Valuation", value: formatCurrency(totalValue, symbol), color: "text-emerald-600 font-bold text-sm" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-24">
                <p className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</p>
                <p className={`text-lg md:text-xl truncate ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <InventoryDistributionChart data={distributionData} symbol={symbol} />
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Qty on Hand</TableHead>
              <TableHead className="text-right">Reorder Level</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Stock Value</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">No inventory records match your filters.</TableCell>
              </TableRow>
            ) : (
              filtered.map((entry, idx) => {
                const qty = Number(entry.quantity);
                const reorder = entry.product.reorderLevel;
                const stockValue = qty * Number(entry.costPrice);
                const isLow = qty > 0 && qty <= reorder;
                const isOut = qty === 0;
                return (
                  <TableRow key={entry.id} className={isOut ? "bg-red-50" : isLow ? "bg-orange-50" : ""}>
                    <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-medium text-indigo-600">{entry.location.locationName}</TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{entry.product.sku}</TableCell>
                    <TableCell className="font-medium">{entry.product.productName}</TableCell>
                    <TableCell className="text-slate-500">{entry.product.category?.categoryName ?? "—"}</TableCell>
                    <TableCell className="text-slate-500">{entry.product.uom?.uomCode ?? "—"}</TableCell>
                    <TableCell className={`text-right font-bold text-lg ${isOut ? "text-red-600" : isLow ? "text-orange-500" : "text-slate-900"}`}>{qty.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-slate-500">{reorder}</TableCell>
                    <TableCell className="text-right text-slate-500">{formatCurrency(Number(entry.costPrice), symbol)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(stockValue, symbol)}</TableCell>
                    <TableCell>
                      {isOut ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">Out of Stock</span>
                      ) : isLow ? (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Low Stock</span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="px-4 py-2 border-t text-xs text-slate-400">{filtered.length} records shown.</div>
      </div>
    </div>
  );
}