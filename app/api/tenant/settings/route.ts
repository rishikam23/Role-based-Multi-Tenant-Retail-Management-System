import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
    
    if (!tenantId) {
      return NextResponse.json({ currencyCode: "USD", currencySymbol: "$" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { currencyCode: true, currencySymbol: true }
    });

    if (tenant) {
      return NextResponse.json(tenant);
    }
    
    return NextResponse.json({ currencyCode: "USD", currencySymbol: "$" });
  } catch (error) {
    return NextResponse.json({ currencyCode: "USD", currencySymbol: "$" }, { status: 500 });
  }
}
