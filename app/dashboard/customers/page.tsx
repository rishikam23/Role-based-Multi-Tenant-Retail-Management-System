import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreateCustomerModal } from "./_components/create-customer-modal";
import { deleteCustomer } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";

export default async function CustomersPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) redirect("/dashboard");

  let canEdit = isSuper || isMaster;
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true },
    });
    if (perms.some((rp) => rp.permission.module === "customers" && rp.permission.action === "edit")) {
      canEdit = true;
    }
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId },
    include: {
      _count: { select: { salesOrders: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">Manage customer profiles and view purchase history.</p>
          </div>
        </div>
        {canEdit && <CreateCustomerModal />}
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: customers.length, color: "text-indigo-600" },
          { label: "Active Customers", value: customers.filter((c) => c.isActive).length, color: "text-emerald-600" },
          { label: "With Purchase History", value: customers.filter((c) => c._count.salesOrders > 0).length, color: "text-violet-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border shadow-sm p-4">
            <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
            <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-12 text-muted-foreground">
                  No customers registered yet. Add your first customer above.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((cust, idx) => (
                <TableRow key={cust.id}>
                  <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                  <TableCell className="font-semibold text-slate-800">{cust.fullName}</TableCell>
                  <TableCell className="text-slate-500">{cust.email || "—"}</TableCell>
                  <TableCell className="text-slate-500">{cust.phone || "—"}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      cust._count.salesOrders > 0
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {cust._count.salesOrders} order{cust._count.salesOrders !== 1 ? "s" : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    {cust.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 border border-green-200">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(cust.createdAt).toLocaleDateString()}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <form action={async () => {
                        "use server";
                        await deleteCustomer(cust.id);
                      }}>
                        <Button variant="destructive" size="sm" type="submit">Remove</Button>
                      </form>
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
