"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateOrgSettings(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId || (!isSuper && !isMaster)) {
    return { error: "Unauthorized. Only admins can update organisation settings." };
  }

  const companyName = formData.get("companyName") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const timezone = formData.get("timezone") as string;
  const currencyCode = formData.get("currencyCode") as string;

  if (!companyName?.trim()) return { error: "Company name is required." };

  // Derive the currency symbol automatically from the code
  let currencySymbol = currencyCode;
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    currencySymbol = parts.find((p) => p.type === "currency")?.value ?? currencyCode;
  } catch {
  }

  try {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        companyName: companyName.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        timezone: timezone || "UTC",
        currencyCode,
        currencySymbol,
      },
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard");
    return { success: true, currencySymbol };
  } catch {
    return { error: "Failed to update organisation settings." };
  }
}