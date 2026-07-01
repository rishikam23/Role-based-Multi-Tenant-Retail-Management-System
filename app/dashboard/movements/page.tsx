import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementType } from "@prisma/client";

export default async function MovementsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view movement history.</p>
      </div>
    );
  }

  const movements = await prisma.stockMovement.findMany({
    where: { tenantId },
    include: {
      product: true,
      fromLocation: true,
      toLocation: true,
      performedBy: true
    },
    orderBy: { performedAt: 'desc' }
  });

  function formatMovementType(type: MovementType) {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  function renderQuantity(qty: number, type: MovementType) {
    const isOutward = ["sale", "adjustment_out", "transfer_out", "return_to_supplier"].includes(type);
    if (isOutward) {
      return <span className="text-red-600 font-medium">- {Math.abs(qty).toLocaleString()}</span>;
    }
    return <span className="text-green-600 font-medium">+ {Math.abs(qty).toLocaleString()}</span>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movement History</h1>
          <p className="text-muted-foreground">Immutable audit trail of all physical stock transactions.</p>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>From Location</TableHead>
              <TableHead>To Location</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No stock movements recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              movements.map((mov) => (
                <TableRow key={mov.id}>
                  <TableCell className="whitespace-nowrap text-sm text-slate-500">
                    {new Date(mov.performedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
                      {formatMovementType(mov.movementType)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate" title={mov.product.productName}>
                    {mov.product.productName}
                  </TableCell>
                  <TableCell className="text-right">
                    {renderQuantity(Number(mov.quantity), mov.movementType)}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {mov.fromLocation?.locationName || "-"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {mov.toLocation?.locationName || "-"}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {mov.performedBy.username}
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {mov.referenceType || "-"} {mov.referenceId ? `#${mov.referenceId}` : ""}
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
