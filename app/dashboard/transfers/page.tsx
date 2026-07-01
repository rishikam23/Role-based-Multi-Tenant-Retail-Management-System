import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateTransferModal } from "./_components/create-transfer-modal";
import { dispatchTransfer, receiveTransfer } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TransfersPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view transfers.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    // For simplicity, relying on inventory clearance
    if (perms.some(rp => rp.permission.module === "inventory" && rp.permission.action === "edit")) {
        canEdit = true;
    }
  }

  const transfers = await prisma.stockTransfer.findMany({
    where: { tenantId },
    include: {
      fromLocation: true,
      toLocation: true,
      createdBy: true,
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
    select: { id: true, productName: true, sku: true }
  });

  const locationOptions = locations.map(l => ({ id: l.id, name: `${l.locationName} (${l.locationCode})` }));
  const productOptions = products.map(p => ({ id: p.id, name: `${p.productName} [${p.sku}]` }));

  function getStatusBadge(status: string) {
    switch(status) {
      case "draft":
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">Draft</span>;
      case "in_transit":
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">In Transit</span>;
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
          <h1 className="text-3xl font-bold tracking-tight">Stock Transfers</h1>
          <p className="text-muted-foreground">Manage and track inventory moving between physical locations.</p>
        </div>
        {canEdit && (
          <CreateTransferModal 
            locations={locationOptions} 
            products={productOptions} 
          />
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Items / Qty</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  No stock transfers found. Create one to move inventory between locations.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((trn) => (
                <TableRow key={trn.id}>
                  <TableCell className="font-bold text-slate-700">{trn.transferNo}</TableCell>
                  <TableCell className="text-slate-500">{new Date(trn.transferDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{trn.fromLocation.locationName}</TableCell>
                  <TableCell className="font-medium text-indigo-600">{trn.toLocation.locationName}</TableCell>
                  <TableCell>
                    {trn.items.map(item => (
                      <div key={item.id} className="text-sm">
                        {item.product.productName} <span className="text-slate-500">(x{Number(item.requestedQty)})</span>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>{getStatusBadge(trn.status)}</TableCell>
                  
                  {canEdit && (
                    <TableCell className="text-right">
                      {trn.status === "draft" && (
                        <form action={async () => {
                          "use server";
                          await dispatchTransfer(trn.id);
                        }}>
                          <Button size="sm" type="submit" variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                            Dispatch
                          </Button>
                        </form>
                      )}
                      
                      {trn.status === "in_transit" && (
                        <form action={async () => {
                          "use server";
                          await receiveTransfer(trn.id);
                        }}>
                          <Button size="sm" type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            Receive Stock
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
