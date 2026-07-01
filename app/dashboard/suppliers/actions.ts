"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createSupplier(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const supplierName = formData.get("supplierName")?.toString();
  const contactPerson = formData.get("contactPerson")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();

  if (!supplierName) {
    return { error: "Supplier Name is required" };
  }

  try {
    await prisma.supplier.create({
      data: {
        tenantId: parseInt(tenantId),
        supplierName,
        contactPerson,
        email,
        phone
      }
    });
    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to create supplier." };
  }
}

export async function updateSupplier(supplierId: number, formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };

  const supplierName = formData.get("supplierName")?.toString();
  const contactPerson = formData.get("contactPerson")?.toString();
  const email = formData.get("email")?.toString();
  const phone = formData.get("phone")?.toString();
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!supplierName) {
    return { error: "Supplier Name is required" };
  }

  try {
    await prisma.supplier.update({
      where: { id: supplierId, tenantId: parseInt(session.user.tenantId) },
      data: { supplierName, contactPerson, email, phone, isActive }
    });
    revalidatePath("/dashboard/suppliers");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update supplier." };
  }
}

export async function deleteSupplier(supplierId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  try {
    await prisma.supplier.delete({
      where: { id: supplierId, tenantId: parseInt(session.user.tenantId) },
    });
    revalidatePath("/dashboard/suppliers");
  } catch (error) {
    console.error("Failed to delete supplier:", error);
  }
}
