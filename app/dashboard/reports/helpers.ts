import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";

export async function getTenantCurrency() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) return { symbol: "$", code: "USD", tenantId: null };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { currencySymbol: true, currencyCode: true },
  });

  return {
    symbol: tenant?.currencySymbol ?? "$",
    code: tenant?.currencyCode ?? "USD",
    tenantId,
  };
}

export function formatCurrency(amount: number, symbol: string) {
  return `${symbol}${new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}