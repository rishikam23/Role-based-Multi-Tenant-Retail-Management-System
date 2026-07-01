import prisma from "@/lib/prisma";
import { CreateTenantModal } from "./create-tenant-modal";
import { CreateSuperAdminModal } from "./create-super-admin-modal";
import { deleteTenant } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export async function MasterAdminDashboard() {
  const [totalTenants, activeTenants, inactiveTenants, allTenantsList] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.tenant.count({ where: { isActive: false } }),
    prisma.tenant.findMany({ 
      orderBy: { createdAt: 'asc' },
      take: 10 
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Total Client Tenants</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{totalTenants}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Active Tenants</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-green-600">{activeTenants}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Suspended Tenants</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-red-600">{inactiveTenants}</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between border-b">
          <div>
            <h3 className="text-lg font-semibold">Registered Organizations</h3>
            <p className="text-sm text-muted-foreground">Manage companies using the platform.</p>
          </div>
          <CreateTenantModal />
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenant Code</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Created At</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTenantsList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No tenants registered yet. Create one above!
                </TableCell>
              </TableRow>
            ) : (
              allTenantsList.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">{tenant.tenantCode}</TableCell>
                  <TableCell>{tenant.companyName}</TableCell>
                  <TableCell>
                    {tenant.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600 border border-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600 border border-red-200">
                        Suspended
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <CreateSuperAdminModal tenantId={tenant.id} companyName={tenant.companyName} />
                      <form action={async () => {
                        "use server";
                        await deleteTenant(tenant.id);
                      }}>
                        <Button variant="destructive" size="sm" type="submit">
                          Remove
                        </Button>
                      </form>
                    </div>
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
