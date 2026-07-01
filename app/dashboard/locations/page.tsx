import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateLocationModal } from "./_components/create-location-modal";
import { EditLocationModal } from "./_components/edit-location-modal";
import { deleteLocation } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LocationsPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect("/dashboard");
  }

  const tenantId = parseInt(session.user.tenantId);
  const isMaster = session.user.userType === "master_admin";
  const isSuper = session.user.userType === "super_admin";

  let canEdit = isSuper || isMaster;
  if (!isMaster && session.user.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    if (perms.length > 0) {
      canEdit = false;
      if (perms.some(rp => rp.permission.module === "locations" && rp.permission.action === "edit")) {
          canEdit = true;
      }
    }
  }

  const locations = await prisma.location.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
        <p className="text-muted-foreground">
          Manage your stores, warehouses and branches.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between border-b">
          <div>
            <h3 className="text-lg font-semibold">Active Locations</h3>
          </div>
          {canEdit && <CreateLocationModal />}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Location Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Created At</TableHead>
              {canEdit && <TableHead className="text-right w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No locations registered yet.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.locationCode}</TableCell>
                  <TableCell>{loc.locationName}</TableCell>
                  <TableCell className="capitalize">{loc.locationType}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(loc.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditLocationModal location={loc} />
                        <form action={async () => {
                          "use server";
                          await deleteLocation(loc.id);
                        }}>
                          <Button variant="destructive" size="sm" type="submit">
                            Remove
                          </Button>
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