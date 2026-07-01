import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateUnitModal } from "./_components/create-unit-modal";
import { EditUnitModal } from "./_components/edit-unit-modal";
import { deleteUnit } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UnitsPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view units of measure.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;
  
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    if (perms.some(rp => rp.permission.module === "products" && rp.permission.action === "edit")) {
        canEdit = true;
    }
  }

  const units = await prisma.unitOfMeasure.findMany({
    where: { tenantId },
    orderBy: { uomCode: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Units of Measure</h1>
          <p className="text-muted-foreground">Define base quantification standards for inventory items.</p>
        </div>
        {canEdit && <CreateUnitModal />}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Code</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 4 : 3} className="text-center py-8 text-muted-foreground">
                  No units defined yet.
                </TableCell>
              </TableRow>
            ) : (
              units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-bold">{unit.uomCode}</TableCell>
                  <TableCell>{unit.uomName}</TableCell>
                  <TableCell>
                    {unit.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600 border border-green-200">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">Inactive</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditUnitModal unit={unit} />
                        <form action={async () => {
                          "use server";
                          await deleteUnit(unit.id);
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