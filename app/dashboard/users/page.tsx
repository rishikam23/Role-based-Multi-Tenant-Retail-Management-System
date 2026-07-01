import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { PermissionToggles } from "./_components/permission-toggles";
import { CreateMemberModal } from "./_components/create-member-modal";
import { EditMemberModal } from "./_components/edit-member-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UsersManagementPage() {
  const session = await auth();
  const tenantIdStr = session?.user?.tenantId;
  const isMaster = session?.user?.userType === "master_admin";
  const isSuper = session?.user?.userType === "super_admin";

  let queryFilter = {};
  if (!isMaster && tenantIdStr) {
    queryFilter = { tenantId: parseInt(tenantIdStr) };
  } else if (!isMaster) {
    return <div>Unauthorized</div>;
  }

  const users = await prisma.user.findMany({
    where: queryFilter,
    include: {
      tenant: true,
      role: {
        include: {
          rolePermissions: { include: { permission: true } }
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isMaster ? "Global Security Operations" : "Organization Access Control"}
          </h1>
          <p className="text-muted-foreground">Manage user accounts and their security toggles.</p>
        </div>
        {isSuper && <CreateMemberModal />}
      </div>

      <div className="rounded-xl border bg-card shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              {isMaster && <TableHead>Tenant</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(u => {
              const activePerms: { [key: string]: boolean } = {};
              if (u.role && u.role.rolePermissions) {
                u.role.rolePermissions.forEach(rp => {
                  const key = `${rp.permission.module}:${rp.permission.action}`;
                  activePerms[key.toLowerCase()] = true;
                });
              }

              let displayRole = "Staff Member";
              if (u.role?.roleName && !u.role.roleName.includes("custom_role")) {
                  displayRole = u.role.roleName;
              } else if (u.userType === "super_admin") {
                  displayRole = "Super Administrator";
              }

              const isSelf = !isMaster && u.id.toString() === session?.user?.id;

              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.firstName} {u.lastName}</div>
                    <div className="text-sm text-slate-500">{u.email}</div>
                  </TableCell>
                  {isMaster && <TableCell>{u.tenant?.companyName || "N/A"}</TableCell>}
                  <TableCell className="capitalize">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.userType === 'super_admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.userType.replace("_", " ")}
                      </span>
                  </TableCell>
                  <TableCell>{displayRole}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {(!isSelf && (isMaster || (isSuper && u.userType !== 'super_admin'))) && (
                      <>
                        <EditMemberModal 
                          user={{
                            id: u.id,
                            firstName: u.firstName,
                            lastName: u.lastName,
                            email: u.email,
                            roleName: u.role?.roleName || ""
                          }} 
                        />
                        <PermissionToggles 
                          userId={u.id} 
                          userName={u.firstName} 
                          initialPermissions={activePerms} 
                        />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}