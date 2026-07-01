import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getTenantCurrency, formatCurrency } from "../helpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileBarChart } from "lucide-react";
import { RevenueTrendChart } from "../_components/revenue-trend-chart";

export default async function SalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; location?: string; payment?: string }>;
}) {
  const params = await searchParams;
  const { symbol, tenantId } = await getTenantCurrency();
  if (!tenantId) return <p className="p-8 text-muted-foreground">Unauthorized.</p>;

  const fromDate = params.from ? new Date(params.from) : undefined;
  const toDate = params.to ? new Date(new Date(params.to).setHours(23, 59, 59, 999)) : undefined;
  const locationId = params.location ? parseInt(params.location) : undefined;
  const paymentFilter = params.payment as string | undefined;

  const whereClause: any = { tenantId };
  if (fromDate || toDate) {
    whereClause.saleDate = {};
    if (fromDate) whereClause.saleDate.gte = fromDate;
    if (toDate) whereClause.saleDate.lte = toDate;
  }
  if (locationId) whereClause.locationId = locationId;
  if (paymentFilter && paymentFilter !== "all") whereClause.paymentMethod = paymentFilter;

  const [sales, locations] = await Promise.all([
    prisma.salesOrder.findMany({
      where: whereClause,
      include: {
        location: true,
        cashier: true,
        items: { include: { product: { select: { productName: true, sku: true, costPrice: true } } } },
      },
      orderBy: { saleDate: "desc" },
      take: 100,
    }),
    prisma.location.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, locationName: true },
      orderBy: { locationName: "asc" },
    }),
  ]);

  const confirmedSales = sales.filter((s) => s.status === "confirmed" || s.status === "partially_returned");
  const totalRevenue = confirmedSales.reduce((sum, s) => sum + Number(s.grandTotal), 0);
  
  // Calculate total COGS (Cost of Goods Sold)
  const totalCogs = confirmedSales.reduce((sum, sale) => {
    const saleCogs = sale.items.reduce((itemSum, item) => {
      const cost = Number(item.product.costPrice || 0);
      const qty = Number(item.quantity || 0);
      return itemSum + (cost * qty);
    }, 0);
    return sum + saleCogs;
  }, 0);

  const totalProfit = totalRevenue - totalCogs;
  const profitMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const cancelledCount = sales.filter((s) => s.status === "cancelled").length;
  const cashSales = sales.filter((s) => s.paymentMethod === "cash").reduce((s, o) => s + Number(o.grandTotal), 0);
  const mobileSales = sales.filter((s) => s.paymentMethod === "mobile_money").reduce((s, o) => s + Number(o.grandTotal), 0);
  const cardSales = sales.filter((s) => s.paymentMethod === "card" || s.paymentMethod === "credit").reduce((s, o) => s + Number(o.grandTotal), 0);

  // Generate daily trend timeline
  const trendDates: string[] = [];
  const startTrend = fromDate ? new Date(fromDate) : new Date();
  if (!fromDate) startTrend.setDate(startTrend.getDate() - 6); // default to past 7 days
  const endTrend = toDate ? new Date(toDate) : new Date();
  
  // Cap chart days to 30 to prevent cluttering the visual graph
  const dayDifference = Math.min(
    Math.ceil((endTrend.getTime() - startTrend.getTime()) / (1000 * 60 * 60 * 24)),
    30
  );

  for (let i = 0; i <= dayDifference; i++) {
    const tempDate = new Date(startTrend);
    tempDate.setDate(tempDate.getDate() + i);
    trendDates.push(tempDate.toISOString().split("T")[0]);
  }

  const trendData = trendDates.map((dateStr) => {
    const dailyTotal = confirmedSales
      .filter((s) => new Date(s.saleDate).toISOString().split("T")[0] === dateStr)
      .reduce((sum, s) => sum + Number(s.grandTotal), 0);
    return { date: dateStr, amount: dailyTotal };
  });

  const paymentOptions = ["all", "cash", "card", "mobile_money", "bank_transfer", "credit", "mixed"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="h-7 w-7 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Report</h1>
          <p className="text-muted-foreground">Comprehensive view of all sales transactions.</p>
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
          <label className="text-xs font-medium text-slate-500">Store / Location</label>
          <select name="location" defaultValue={params.location ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.locationName}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Payment Method</label>
          <select name="payment" defaultValue={params.payment ?? "all"} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm capitalize">
            {paymentOptions.map((p) => (
              <option key={p} value={p} className="capitalize">{p.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">Apply Filters</button>
        <a href="/dashboard/reports/sales" className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-slate-50 transition-colors">Clear</a>
      </form>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Revenue", value: formatCurrency(totalRevenue, symbol), color: "text-emerald-600" },
          { label: "Gross Profit", value: `${formatCurrency(totalProfit, symbol)} (${profitMarginPercent.toFixed(1)}%)`, color: "text-indigo-600" },
          { label: "Cash Sales", value: formatCurrency(cashSales, symbol), color: "text-blue-600" },
          { label: "Mobile Money", value: formatCurrency(mobileSales, symbol), color: "text-purple-600" },
          { label: "Card Sales", value: formatCurrency(cardSales, symbol), color: "text-orange-500" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <RevenueTrendChart data={trendData} symbol={symbol} />
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No sales found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale, idx) => {
                const isCancelled = sale.status === "cancelled";
                const isReturned = sale.status === "returned" || sale.status === "partially_returned";
                return (
                  <TableRow key={sale.id} className={isCancelled ? "bg-red-50" : ""}>
                    <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                    <TableCell className="font-bold text-slate-700">
                      {sale.invoiceNo}
                      {isCancelled && <span className="ml-2 text-xs text-red-600 font-normal">Cancelled</span>}
                      {isReturned && <span className="ml-2 text-xs text-orange-600 font-normal">Returned</span>}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">{new Date(sale.saleDate).toLocaleString()}</TableCell>
                    <TableCell>{sale.location.locationName}</TableCell>
                    <TableCell className="text-slate-500">{sale.cashier.firstName} {sale.cashier.lastName}</TableCell>
                    <TableCell>
                      {sale.items.map((item) => (
                        <div key={item.id} className="text-xs text-slate-600">
                          {item.product.productName} × {Number(item.quantity)}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {sale.paymentMethod.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                        isCancelled ? "bg-red-100 text-red-700" :
                        isReturned ? "bg-orange-100 text-orange-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>{sale.status.replace("_", " ")}</span>
                    </TableCell>
                    <TableCell className={`text-right font-bold ${isCancelled || isReturned ? "text-red-600" : "text-emerald-600"}`}>
                      {formatCurrency(Number(sale.grandTotal), symbol)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <div className="px-4 py-2 border-t text-xs text-slate-400">
          Showing {sales.length} records (max 100). Apply filters to narrow down.
          {cancelledCount > 0 && <span className="ml-3 text-red-500">{cancelledCount} cancelled transactions (highlighted in red).</span>}
        </div>
      </div>
    </div>
  );
}