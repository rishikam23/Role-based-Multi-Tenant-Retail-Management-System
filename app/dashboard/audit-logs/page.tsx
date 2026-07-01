import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck } from "lucide-react";

const ACTION_STYLES: Record<string, string> = {
  create:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  update:  "bg-blue-50 text-blue-700 border-blue-200",
  delete:  "bg-red-50 text-red-700 border-red-200",
  login:   "bg-indigo-50 text-indigo-700 border-indigo-200",
  logout:  "bg-slate-100 text-slate-600 border-slate-200",
  approve: "bg-teal-50 text-teal-700 border-teal-200",
  reject:  "bg-orange-50 text-orange-700 border-orange-200",
};

const USER_TYPE_STYLES: Record<string, string> = {
  master_admin: "bg-violet-100 text-violet-700",
  super_admin:  "bg-indigo-100 text-indigo-700",
  member:       "bg-slate-100 text-slate-600",
  system:       "bg-amber-100 text-amber-700",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; action?: string; page?: string }>;
}) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isMaster = session?.user?.userType === "master_admin";
  const isSuper  = session?.user?.userType === "super_admin";

  // Only admins can view audit logs
  if (!isMaster && !isSuper) redirect("/dashboard");

  const params = await searchParams;
  const pageSize = 50;
  const currentPage = params.page ? Math.max(1, parseInt(params.page)) : 1;
  const entityFilter = params.entity || undefined;
  const actionFilter = params.action || undefined;

  const where: any = isMaster ? {} : { tenantId };
  if (entityFilter) where.entity = { contains: entityFilter, mode: "insensitive" };
  if (actionFilter) where.action = { contains: actionFilter, mode: "insensitive" };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  // Resolve user names in bulk
  const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))] as number[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));

  const totalPages = Math.ceil(total / pageSize);

  // Distinct entity types for filter dropdown
  const distinctEntities = await prisma.auditLog.findMany({
    where: isMaster ? {} : { tenantId },
    select: { entity: true },
    distinct: ["entity"],
    orderBy: { entity: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-violet-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">
            Full immutable activity trail — {total.toLocaleString()} record{total !== 1 ? "s" : ""} found.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3 items-end p-4 bg-white rounded-xl border shadow-sm">
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Entity Type</label>
          <select name="entity" defaultValue={params.entity ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Entities</option>
            {distinctEntities.map((e) => (
              <option key={e.entity} value={e.entity}>{e.entity}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label className="text-xs font-medium text-slate-500">Action</label>
          <select name="action" defaultValue={params.action ?? ""} className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm">
            <option value="">All Actions</option>
            {["create", "update", "delete", "login", "logout", "approve", "reject"].map((a) => (
              <option key={a} value={a} className="capitalize">{a}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-9 px-4 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">Filter</button>
        <a href="/dashboard/audit-logs" className="h-9 px-4 rounded-md border text-sm font-medium flex items-center hover:bg-slate-50 transition-colors">Clear</a>
      </form>

      <div className="rounded-xl border bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No audit log entries match your filters. Actions like creating users, updating products, and processing returns will appear here automatically.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, idx) => {
                const actionKey = log.action.toLowerCase();
                const actionStyle = ACTION_STYLES[actionKey] ?? "bg-slate-100 text-slate-600 border-slate-200";
                const userTypeStyle = USER_TYPE_STYLES[log.userType] ?? "bg-slate-100 text-slate-600";
                const userName = log.userId ? (userMap[log.userId] ?? `User #${log.userId}`) : "System";

                return (
                  <TableRow key={log.id}>
                    <TableCell className="text-slate-400 text-xs">{(currentPage - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="text-slate-500 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 text-sm">{userName}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${userTypeStyle}`}>
                        {log.userType.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs font-semibold capitalize px-2.5 py-0.5 rounded-full border ${actionStyle}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-600">{log.entity}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{log.entityId ?? "—"}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[280px]">
                      {log.newValues ? (
                        <details className="cursor-pointer">
                          <summary className="text-indigo-500 hover:text-indigo-700 font-medium">View diff</summary>
                          <pre className="mt-1 text-[10px] bg-slate-50 rounded p-2 overflow-x-auto whitespace-pre-wrap border">
                            {JSON.stringify(log.newValues, null, 2)}
                          </pre>
                        </details>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-slate-500">
            <span>{total.toLocaleString()} total records — Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              {currentPage > 1 && (
                <a
                  href={`/dashboard/audit-logs?${new URLSearchParams({ ...(entityFilter ? { entity: entityFilter } : {}), ...(actionFilter ? { action: actionFilter } : {}), page: String(currentPage - 1) })}`}
                  className="px-3 py-1 rounded border hover:bg-slate-50 transition-colors"
                >← Prev</a>
              )}
              {currentPage < totalPages && (
                <a
                  href={`/dashboard/audit-logs?${new URLSearchParams({ ...(entityFilter ? { entity: entityFilter } : {}), ...(actionFilter ? { action: actionFilter } : {}), page: String(currentPage + 1) })}`}
                  className="px-3 py-1 rounded border hover:bg-slate-50 transition-colors"
                >Next →</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
