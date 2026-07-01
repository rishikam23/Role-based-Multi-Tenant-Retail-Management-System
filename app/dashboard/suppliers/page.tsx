import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateSupplierModal } from "./_components/create-supplier-modal";
import { EditSupplierModal } from "./_components/edit-supplier-modal";
import { deleteSupplier } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function SuppliersPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view suppliers.</p>
      </div>
    );
  }
  
  let canEdit = isSuper || isMaster;
  
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    if (perms.some(rp => rp.permission.module === "suppliers" && rp.permission.action === "edit")) {
        canEdit = true;
    }
  }

  const suppliers = await prisma.supplier.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers Directory</h1>
          <p className="text-muted-foreground">Manage vendor profiles and contact data for procurement.</p>
        </div>
        {canEdit && <CreateSupplierModal />}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  No suppliers registered yet.
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((sup) => (
                <TableRow key={sup.id}>
                  <TableCell className="font-medium">{sup.supplierName}</TableCell>
                  <TableCell>{sup.contactPerson || "N/A"}</TableCell>
                  <TableCell>{sup.email || "N/A"}</TableCell>
                  <TableCell>{sup.phone || "N/A"}</TableCell>
                  <TableCell>
                    {sup.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600 border border-green-200">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">Inactive</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditSupplierModal supplier={sup} />
                        <form action={async () => {
                          "use server";
                          await deleteSupplier(sup.id);
                        }}>
                          <Button variant="destructive" size="sm" type="submit">Delete</Button>
                        </form>
                      </div>
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
