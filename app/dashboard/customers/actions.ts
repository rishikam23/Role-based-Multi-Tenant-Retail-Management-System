"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function createCustomer(fd: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) throw new Error("Unauthorized");

  const fullName = fd.get("fullName") as string;
  const email = (fd.get("email") as string) || null;
  const phone = (fd.get("phone") as string) || null;

  if (!fullName?.trim()) throw new Error("Full name is required.");

  await prisma.customer.create({
    data: { tenantId, fullName: fullName.trim(), email: email || undefined, phone: phone || undefined }
  });

  revalidatePath("/dashboard/customers");
}

export async function deleteCustomer(id: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) throw new Error("Unauthorized");

  await prisma.customer.deleteMany({ where: { id, tenantId } });
  revalidatePath("/dashboard/customers");
}
