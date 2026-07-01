import { LogoutButton } from "./_components/logout-button";
import { PersonalSettingsModal } from "./_components/personal-settings-modal";
import { AiChatbot } from "./_components/ai-chatbot";
import { auth } from "@/auth";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isMaster = session?.user?.userType === "master_admin";
  const isSuper = session?.user?.userType === "super_admin";
  const isMember = session?.user?.userType === "member";

  let hasLocations = isSuper;
  let hasProducts = isSuper;
  let currentUsername = "";

  if (isMaster) {
    const m = await prisma.masterAdmin.findUnique({ where: { id: Number(session?.user?.id) } });
    if (m) currentUsername = m.username;
  } else if (session?.user?.id) {
    const u = await prisma.user.findUnique({ where: { id: Number(session.user.id) } });
    if (u) currentUsername = u.username;
  }

  if (!isMaster && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    
    if (perms.length > 0) {
      hasLocations = false;
      hasProducts = false;
      perms.forEach(rp => {
        const isLoc = rp.permission.module === "locations";
        const isProd = rp.permission.module === "products";
        const hasAccess = rp.permission.action === "view" || rp.permission.action === "edit";

        if (isLoc && hasAccess) hasLocations = true;
        if (isProd && hasAccess) hasProducts = true;
      });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full">
      <header className="sticky top-0 z-10 w-full border-b bg-white shadow-sm">
        <div className="flex flex-col md:flex-row min-h-[4rem] w-full items-center justify-between px-6 lg:px-8 py-3 md:py-0 gap-3 md:gap-0">
          <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-6">
            <span className="text-xl font-bold tracking-tight text-slate-900 shrink-0">InventorySystem</span>
            <div className="flex md:hidden items-center gap-4 shrink-0">
              <PersonalSettingsModal currentUsername={currentUsername} />
              <LogoutButton />
            </div>
          </div>
          
          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600 overflow-x-auto w-full md:w-auto whitespace-nowrap pb-1 md:pb-0 px-4 md:px-6 no-scrollbar">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">Overview</Link>
            {!isMaster && (
              <>
                {hasLocations && <Link href="/dashboard/locations" className="hover:text-slate-900 transition-colors">Locations</Link>}
                {hasProducts && (
                  <>
                    <Link href="/dashboard/products" className="hover:text-slate-900 transition-colors">Products</Link>
                    <Link href="/dashboard/inventory" className="hover:text-slate-900 transition-colors font-bold text-indigo-700">Inventory</Link>
                    <Link href="/dashboard/sales" className="hover:text-slate-900 transition-colors font-bold text-emerald-600">Sales</Link>
                    <Link href="/dashboard/returns" className="hover:text-slate-900 transition-colors font-bold text-orange-500">Returns</Link>
                    <Link href="/dashboard/cashups" className="hover:text-slate-900 transition-colors font-bold text-amber-600">Cash Up</Link>
                    <Link href="/dashboard/movements" className="hover:text-slate-900 transition-colors">Movements</Link>
                    <Link href="/dashboard/purchases" className="hover:text-slate-900 transition-colors">Purchases</Link>
                    <Link href="/dashboard/transfers" className="hover:text-slate-900 transition-colors">Transfers</Link>
                    <Link href="/dashboard/reports" className="hover:text-slate-900 transition-colors font-semibold text-violet-600">Reports</Link>
                    <Link href="/dashboard/customers" className="hover:text-slate-900 transition-colors">Customers</Link>
                    <Link href="/dashboard/categories" className="hover:text-slate-900 transition-colors">Categories</Link>
                    <Link href="/dashboard/units" className="hover:text-slate-900 transition-colors">Units</Link>
                    <Link href="/dashboard/suppliers" className="hover:text-slate-900 transition-colors">Suppliers</Link>
                  </>
                )}
              </>
            )}
            {!isMember && (
              <>
                <Link href="/dashboard/users" className="hover:text-slate-900 transition-colors">Security</Link>
                <Link href="/dashboard/audit-logs" className="hover:text-slate-900 transition-colors text-violet-600 font-semibold">Audit Logs</Link>
              </>
            )}
            {(isSuper || isMaster) && <Link href="/dashboard/settings" className="hover:text-slate-900 transition-colors">⚙ Organization Settings</Link>}
          </nav>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            <PersonalSettingsModal currentUsername={currentUsername} />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        {children}
      </main>
      <AiChatbot />
    </div>
  );
}