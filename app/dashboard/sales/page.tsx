import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateSaleModal } from "./_components/create-sale-modal";
import { DynamicCurrencyDisplay } from "../products/_components/dynamic-currency";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SalesPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view sales.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;

  const sales = await prisma.salesOrder.findMany({
    where: { tenantId },
    include: {
      location: true,
      cashier: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, locationName: true, locationCode: true }
  });
  
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, productName: true, sku: true, sellingPrice: true }
  });

  const locationOptions = locations.map(l => ({ id: l.id, name: `${l.locationName} (${l.locationCode})` }));
  const productOptions = products.map(p => ({ id: p.id, name: `${p.productName} [${p.sku}]`, price: Number(p.sellingPrice) }));

  function getPaymentBadge(method: string) {
    switch(method) {
      case "cash":
        return <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Cash</span>;
      case "credit_card":
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Card</span>;
      case "mobile_money":
        return <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-600/20">Mobile</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 capitalize">{method.replace('_', ' ')}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales & Transactions</h1>
          <p className="text-muted-foreground">Manage your point-of-sale customer invoices.</p>
        </div>
        {canEdit && (
          <CreateSaleModal 
            locations={locationOptions} 
            products={productOptions} 
          />
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Date / Time</TableHead>
              <TableHead>Store Location</TableHead>
              <TableHead>Items Sold</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Grand Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No sales recorded yet. Use the Ring Up Sale button to process a transaction.
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-bold text-slate-700">{sale.invoiceNo}</TableCell>
                  <TableCell className="text-slate-500">{new Date(sale.saleDate).toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-indigo-600">{sale.location.locationName}</TableCell>
                  <TableCell>
                    {sale.items.map(item => (
                      <div key={item.id} className="text-sm">
                        {item.product.productName} <span className="text-slate-500">(x{Number(item.quantity)})</span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{getPaymentBadge(sale.paymentMethod)}</TableCell>
                  <TableCell className="text-right font-bold text-lg text-emerald-600">
                    <DynamicCurrencyDisplay amount={Number(sale.grandTotal)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}