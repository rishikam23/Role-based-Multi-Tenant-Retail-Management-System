"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Utility to write an audit log entry — call this from any action
export async function writeAuditLog({
  action,
  entity,
  entityId,
  oldValues,
  newValues,
}: {
  action: string;
  entity: string;
  entityId?: number;
  oldValues?: object;
  newValues?: object;
}) {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    const userType = (session?.user?.userType as any) ?? "member";

    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        userType,
        action,
        entity,
        entityId,
        oldValues: oldValues ?? undefined,
        newValues: newValues ?? undefined,
      },
    });
  } catch {
    // Never let audit logging crash the main operation
  }
}
