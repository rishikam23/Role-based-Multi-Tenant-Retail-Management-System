"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createCategory(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const categoryName = formData.get("categoryName")?.toString();
  const parentIdRaw = formData.get("parentId")?.toString();
  
  if (!categoryName) {
    return { error: "Category Name is required" };
  }

  let parentId = null;
  if (parentIdRaw && parentIdRaw !== "null" && parentIdRaw !== "") {
    parentId = parseInt(parentIdRaw);
  }

  try {
    await prisma.category.create({
      data: {
        tenantId: parseInt(tenantId),
        categoryName,
        parentId
      }
    });
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to create category." };
  }
}

export async function updateCategory(categoryId: number, formData: FormData) {
  const session = await auth();
  if (!session?.user?.tenantId) return { error: "Unauthorized" };

  const categoryName = formData.get("categoryName")?.toString();
  const parentIdRaw = formData.get("parentId")?.toString();
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!categoryName) {
    return { error: "Category Name is required" };
  }

  let parentId = null;
  if (parentIdRaw && parentIdRaw !== "null" && parentIdRaw !== "") {
    parentId = parseInt(parentIdRaw);
  }

  if (parentId === categoryId) {
    return { error: "A category cannot be its own parent." };
  }

  try {
    await prisma.category.update({
      where: { id: categoryId, tenantId: parseInt(session.user.tenantId) },
      data: { categoryName, parentId, isActive }
    });
    revalidatePath("/dashboard/categories");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update category." };
  }
}

export async function deleteCategory(categoryId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  try {
    await prisma.category.delete({
      where: { id: categoryId, tenantId: parseInt(session.user.tenantId) },
    });
    revalidatePath("/dashboard/categories");
  } catch (error) {
    console.error("Failed to delete category:", error);
  }
}
