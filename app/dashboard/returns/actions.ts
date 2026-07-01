"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function processReturn(fd: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  if (!tenantId || !userId) throw new Error("Unauthorized");

  const salesOrderId = parseInt(fd.get("salesOrderId") as string);
  const returnReason = (fd.get("returnReason") as string) || null;
  const totalRefunded = parseFloat(fd.get("totalRefunded") as string) || 0;

  // Verify this order belongs to tenant
  const order = await prisma.salesOrder.findFirst({
    where: { id: salesOrderId, tenantId },
  });
  if (!order) throw new Error("Sales order not found.");

  const count = await prisma.salesReturn.count({ where: { tenantId } });
  const returnNo = `RET-${String(count + 1).padStart(5, "0")}`;

  await prisma.$transaction([
    prisma.salesReturn.create({
      data: {
        tenantId,
        salesOrderId,
        returnNo,
        returnReason: returnReason?.trim() || null,
        totalRefunded,
        status: "pending",
        processedById: userId,
      },
    }),
    prisma.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: "partially_returned" },
    }),
  ]);

  revalidatePath("/dashboard/returns");
  revalidatePath("/dashboard/sales");
}

export async function approveReturn(returnId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) throw new Error("Unauthorized");

  await prisma.salesReturn.updateMany({
    where: { id: returnId, tenantId },
    data: { status: "approved" },
  });
  revalidatePath("/dashboard/returns");
}

export async function rejectReturn(returnId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) throw new Error("Unauthorized");

  await prisma.salesReturn.updateMany({
    where: { id: returnId, tenantId },
    data: { status: "rejected" },
  });
  revalidatePath("/dashboard/returns");
}
