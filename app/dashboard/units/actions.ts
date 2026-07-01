"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createUnit(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const uomCode = formData.get("uomCode")?.toString();
  const uomName = formData.get("uomName")?.toString();
  
  if (!uomCode || !uomName) {
    return { error: "Unit Code and Unit Name are required" };
  }

  try {
    await prisma.unitOfMeasure.create({
      data: {
        tenantId: parseInt(tenantId),
        uomCode: uomCode.toUpperCase(),
        uomName
      }
    });
    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A Unit of Measure with this code already exists." };
    }
    return { error: "Failed to create unit of measure." };
  }
}

export async function updateUnit(unitId: number, formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };

  const uomCode = formData.get("uomCode")?.toString();
  const uomName = formData.get("uomName")?.toString();
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!uomCode || !uomName) {
    return { error: "Unit Code and Unit Name are required" };
  }

  try {
    await prisma.unitOfMeasure.update({
      where: { id: unitId, tenantId: parseInt(session.user.tenantId) },
      data: { uomCode: uomCode.toUpperCase(), uomName, isActive }
    });
    revalidatePath("/dashboard/units");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A Unit of Measure with this code already exists." };
    }
    return { error: "Failed to update unit of measure." };
  }
}

export async function deleteUnit(unitId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  try {
    await prisma.unitOfMeasure.delete({
      where: { id: unitId, tenantId: parseInt(session.user.tenantId) },
    });
    revalidatePath("/dashboard/units");
  } catch (error) {
    console.error("Failed to delete unit of measure:", error);
  }
}
