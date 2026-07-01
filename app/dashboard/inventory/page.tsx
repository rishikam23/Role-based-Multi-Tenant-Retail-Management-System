import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { AdjustStockModal } from "./_components/adjust-stock-modal";
import { DynamicCurrencyDisplay } from "../products/_components/dynamic-currency";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function InventoryPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view inventory.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    // Check if they have rights to stock movements/adjustments
    if (perms.some(rp => rp.permission.module === "inventory" && rp.permission.action === "edit")) {
        canEdit = true;
    }
  }

  // 1. Fetch Real-Time Ledger
  const ledgerEntries = await prisma.stockLedger.findMany({
    where: { tenantId },
    include: {
      product: true,
      location: true
    },
    orderBy: [
      { location: { locationName: 'asc' } },
      { product: { productName: 'asc' } }
    ]
  });

  // 2. Fetch Dropdowns for the Modal
  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, locationName: true, locationCode: true }
  });
  
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, productName: true, sku: true }
  });

  const locationOptions = locations.map(l => ({ id: l.id, name: `${l.locationName} (${l.locationCode})` }));
  const productOptions = products.map(p => ({ id: p.id, name: `${p.productName} [${p.sku}]` }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Ledger Dashboard</h1>
          <p className="text-muted-foreground">Real-time quantification of physical inventory across all locations.</p>
        </div>
        {canEdit && (
          <AdjustStockModal 
            locations={locationOptions} 
            products={productOptions} 
          />
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Quantity on Hand</TableHead>
              <TableHead className="text-right">Avg Cost Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No stock has been recorded yet. Use the Adjust Stock button to log your opening inventory.
                </TableCell>
              </TableRow>
            ) : (
              ledgerEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium text-indigo-600">{entry.location.locationName}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{entry.product.sku}</TableCell>
                  <TableCell className="font-medium">{entry.product.productName}</TableCell>
                  <TableCell>
                    {entry.batchNo ? (
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                        {entry.batchNo}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {Number(entry.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    <DynamicCurrencyDisplay amount={Number(entry.costPrice)} />
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
