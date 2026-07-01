import prisma from "@/lib/prisma";
import { EditMemberModal } from "./edit-member-modal";
import { deleteMember } from "../users/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth } from "@/auth";

export async function TenantDashboard({ tenantId }: { tenantId: number }) {
  const session = await auth();
  const isSuper = session?.user?.userType === "super_admin";

  const [totalProducts, totalLocations, totalSuppliers, activeUsers, orgUsers] = await Promise.all([
    prisma.product.count({ where: { tenantId } }),
    prisma.location.count({ where: { tenantId } }),
    prisma.supplier.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.user.findMany({ 
        where: { tenantId }, 
        orderBy: { createdAt: 'asc' },
        include: { role: true }
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Total Products</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{totalProducts}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Active Locations</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{totalLocations}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">Registered Suppliers</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{totalSuppliers}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 py-4">
            <h3 className="tracking-tight text-sm font-medium">System Users</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{activeUsers}</div>
          </div>
        </div>
      </div>

      {isSuper && (
        <div className="rounded-xl border bg-card text-card-foreground shadow mt-8">
          <div className="p-6 flex flex-row items-center justify-between border-b">
            <h3 className="text-lg font-semibold">Active Personnel Database</h3>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ident</TableHead>
                <TableHead>Contact Profile</TableHead>
                <TableHead>System Alignment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[180px]">Config</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgUsers.map(u => {
                  let displayRole = "Staff Member";
                  if (u.role?.roleName && !u.role.roleName.includes("custom_role")) {
                      displayRole = u.role.roleName;
                  } else if (u.userType === "super_admin") {
                      displayRole = "Super Administrator";
                  }

                  const isSelf = u.id.toString() === session?.user?.id;

                  return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                            {u.firstName} {u.lastName}
                        </TableCell>
                        <TableCell className="text-slate-500">
                            {u.email}
                        </TableCell>
                        <TableCell>{displayRole}</TableCell>
                        <TableCell>
                            {u.isActive ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Terminated
                                </span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                             {!isSelf && (
                                <>
                                  <EditMemberModal user={{ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }} />
                                  <form action={async () => {
                                      "use server";
                                      await deleteMember(u.id);
                                  }}>
                                      <Button variant="destructive" size="sm" type="submit">Purge</Button>
                                  </form>
                                </>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                  )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
