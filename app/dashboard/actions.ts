"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createTenant(formData: FormData) {
  const session = await auth();
  if (session?.user?.userType !== "master_admin") {
    return { error: "Unauthorized. Only Master Admins can create tenants." };
  }

  const companyName = formData.get("companyName")?.toString();
  const tenantCode = formData.get("tenantCode")?.toString();

  if (!companyName || !tenantCode) {
    return { error: "Company Name and Tenant Code are required." };
  }

  try {
    await prisma.tenant.create({
      data: {
        companyName,
        tenantCode,
        managedById: parseInt(session.user.id),
      },
    });

    revalidatePath("/dashboard");
    
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "That Tenant Code is already in use by another company." };
    }
    return { error: "Failed to create tenant. Check logs." };
  }
}

export async function deleteTenant(tenantId: number, formData?: FormData) {
  const session = await auth();
  if (session?.user?.userType !== "master_admin") {
    throw new Error("Unauthorized");
  }

  try {
    await prisma.tenant.delete({
      where: { id: tenantId },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("Failed to delete tenant:", error);
  }
}

import bcrypt from "bcryptjs";

export async function createSuperAdmin(formData: FormData) {
  const session = await auth();
  if (session?.user?.userType !== "master_admin") {
    return { error: "Unauthorized" };
  }

  const tenantId = parseInt(formData.get("tenantId") as string);
  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!tenantId || !firstName || !lastName || !email || !password) {
    return { error: "All fields are required" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        tenantId,
        userType: "super_admin",
        firstName,
        lastName,
        email,
        username: email,
        passwordHash,
      }
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Email is already in use." };
    }
    return { error: "Failed to create super admin." };
  }
}

import { LocationType } from "@prisma/client";

export async function createLocation(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const locationName = formData.get("locationName")?.toString();
  const locationCode = formData.get("locationCode")?.toString();
  const locationType = formData.get("locationType") as LocationType;

  if (!locationName || !locationCode || !locationType) {
    return { error: "All fields are required" };
  }

  try {
    await prisma.location.create({
      data: {
        tenantId: parseInt(tenantId),
        locationName,
        locationCode,
        locationType
      }
    });
    revalidatePath("/dashboard/locations");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Location code must be unique within your organization." };
    }
    return { error: "Failed to create location." };
  }
}

export async function updateLocation(locationId: number, formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const locationName = formData.get("locationName")?.toString();
  const locationCode = formData.get("locationCode")?.toString();
  const locationType = formData.get("locationType") as LocationType;
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!locationName || !locationCode || !locationType) {
    return { error: "All fields are required" };
  }

  try {
    await prisma.location.update({
      where: { id: locationId, tenantId: parseInt(tenantId) },
      data: {
        locationName,
        locationCode,
        locationType,
        isActive
      }
    });
    revalidatePath("/dashboard/locations");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Location code must be unique within your organization." };
    }
    return { error: "Failed to update location." };
  }
}

export async function deleteLocation(locationId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  try {
    await prisma.location.delete({
      where: { id: locationId, tenantId: parseInt(session.user.tenantId) },
    });
    revalidatePath("/dashboard/locations");
  } catch (error) {
    console.error("Failed to delete location:", error);
  }
}

import { ProductType } from "@prisma/client";

export async function createProduct(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const sku = formData.get("sku")?.toString();
  const productName = formData.get("productName")?.toString();
  const productType = formData.get("productType") as ProductType;
  const sellingPrice = parseFloat(formData.get("sellingPrice")?.toString() || "0");
  const costPrice = parseFloat(formData.get("costPrice")?.toString() || "0");
  const reorderLevel = parseInt(formData.get("reorderLevel")?.toString() || "0");

  if (!sku || !productName) {
    return { error: "SKU and Product Name are required" };
  }

  try {
    await prisma.product.create({
      data: {
        tenantId: parseInt(tenantId),
        sku,
        productName,
        productType,
        sellingPrice,
        costPrice,
        reorderLevel,
      }
    });
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "SKU must be unique." };
    }
    return { error: "Failed to create product." };
  }
}

export async function updateProduct(productId: number, formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  
  if (!tenantId) return { error: "Unauthorized" };

  const sku = formData.get("sku")?.toString();
  const productName = formData.get("productName")?.toString();
  const productType = formData.get("productType") as ProductType;
  const sellingPrice = parseFloat(formData.get("sellingPrice")?.toString() || "0");
  const costPrice = parseFloat(formData.get("costPrice")?.toString() || "0");
  const reorderLevel = parseInt(formData.get("reorderLevel")?.toString() || "0");
  const isActive = formData.get("isActive")?.toString() === "true";

  if (!sku || !productName) {
    return { error: "SKU and Product Name are required" };
  }

  try {
    await prisma.product.update({
      where: { id: productId, tenantId: parseInt(tenantId) },
      data: {
        sku,
        productName,
        productType,
        sellingPrice,
        costPrice,
        reorderLevel,
        isActive
      }
    });
    revalidatePath("/dashboard/products");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "SKU must be unique." };
    }
    return { error: "Failed to update product." };
  }
}

export async function deleteProduct(productId: number) {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  try {
    await prisma.product.delete({
      where: { id: productId, tenantId: parseInt(session.user.tenantId) },
    });
    revalidatePath("/dashboard/products");
  } catch (error) {
    console.error("Failed to delete product:", error);
  }
}

export async function updatePersonalSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not logged in" };

  const username = formData.get("username")?.toString();
  const password = formData.get("password")?.toString();

  if (!username) return { error: "Username is required" };

  try {
    let updateData: any = { username };
    if (password && password.trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (session.user.userType === "master_admin") {
      await prisma.masterAdmin.update({
        where: { id: parseInt(session.user.id) },
        data: updateData
      });
    } else {
      await prisma.user.update({
        where: { id: parseInt(session.user.id) },
        data: updateData
      });
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "Username is already taken by another user." };
    }
    return { error: "Failed to update profile settings." };
  }
}