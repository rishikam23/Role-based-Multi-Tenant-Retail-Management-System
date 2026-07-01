import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreatePOModal } from "./_components/create-po-modal";
import { approvePO, receivePO } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DynamicCurrencyDisplay } from "../products/_components/dynamic-currency";

export default async function PurchasesPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view purchase orders.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;

  const purchases = await prisma.purchaseOrder.findMany({
    where: { tenantId },
    include: {
      supplier: true,
      receivingLocation: true,
      createdBy: true,
      items: {
        include: { product: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, supplierName: true }
  });

  const locations = await prisma.location.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, locationName: true, locationCode: true }
  });
  
  const products = await prisma.product.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, productName: true, sku: true }
  });

  const supplierOptions = suppliers.map(s => ({ id: s.id, name: s.supplierName }));
  const locationOptions = locations.map(l => ({ id: l.id, name: `${l.locationName} (${l.locationCode})` }));
  const productOptions = products.map(p => ({ id: p.id, name: `${p.productName} [${p.sku}]` }));

  function getStatusBadge(status: string) {
    switch(status) {
      case "draft":
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Draft</span>;
      case "approved":
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Approved</span>;
      case "received":
        return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Received</span>;
      case "cancelled":
        return <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">Cancelled</span>;
      default:
        return <span>{status}</span>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage procurement and receive stock from vendors.</p>
        </div>
        {canEdit && (
          <CreatePOModal 
            suppliers={supplierOptions}
            locations={locationOptions} 
            products={productOptions} 
          />
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Delivery Location</TableHead>
              <TableHead>Items / Cost</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No purchase orders found. Create one to order stock.
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-bold text-slate-700">{po.poNumber}</TableCell>
                  <TableCell className="text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium text-indigo-600">{po.supplier.supplierName}</TableCell>
                  <TableCell className="font-medium">{po.receivingLocation.locationName}</TableCell>
                  <TableCell>
                    {po.items.map(item => (
                      <div key={item.id} className="text-sm">
                        {item.product.productName} <span className="text-slate-500">(x{Number(item.orderedQty)})</span>
                        {" - "}
                        <span className="text-slate-600 font-medium">
                          <DynamicCurrencyDisplay amount={Number(item.unitCost)} /> ea
                        </span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{getStatusBadge(po.status)}</TableCell>
                  
                  {canEdit && (
                    <TableCell className="text-right">
                      {po.status === "draft" && (
                        <form action={async () => {
                          "use server";
                          await approvePO(po.id);
                        }}>
                          <Button size="sm" type="submit" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                            Approve PO
                          </Button>
                        </form>
                      )}
                      
                      {po.status === "approved" && (
                        <form action={async () => {
                          "use server";
                          await receivePO(po.id);
                        }}>
                          <Button size="sm" type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            Receive Goods
                          </Button>
                        </form>
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