import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MasterAdminDashboard } from "./_components/master-dashboard";
import { TenantDashboard } from "./_components/tenant-dashboard";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { userType, name } = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {name}</h1>
        <p className="text-muted-foreground">
          {userType === "master_admin" 
            ? "Platform Management Overview"
            : "Inventory Management Dashboard"}
        </p>
      </div>

      {userType === "master_admin" ? (
        <MasterAdminDashboard />
      ) : (
        <TenantDashboard tenantId={Number(session.user.tenantId)} />
      )}
    </div>
  );
}