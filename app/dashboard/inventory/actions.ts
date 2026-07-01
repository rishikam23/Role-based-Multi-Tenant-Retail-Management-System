"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { MovementType } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function adjustStock(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  const locationId = parseInt(formData.get("locationId") as string);
  const productId = parseInt(formData.get("productId") as string);
  const adjustmentType = formData.get("adjustmentType") as string;
  const rawQuantity = parseFloat(formData.get("quantity") as string);
  const batchNo = formData.get("batchNo")?.toString() || null;
  const costPrice = parseFloat(formData.get("costPrice")?.toString() || "0");
  const referenceType = "Manual Adjustment";
  const referenceIdStr = formData.get("referenceId")?.toString();

  if (isNaN(locationId) || isNaN(productId) || isNaN(rawQuantity) || rawQuantity <= 0) {
    return { error: "Valid Location, Product, and positive Quantity are required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Determine movement math
      let quantityChange = new Prisma.Decimal(rawQuantity);
      let mType: MovementType;

      if (adjustmentType === "IN") {
        mType = MovementType.adjustment_in;
      } else if (adjustmentType === "OPENING") {
        mType = MovementType.opening_stock;
      } else {
        mType = MovementType.adjustment_out;
        quantityChange = quantityChange.mul(-1);
      }

      // 2. Find or Create Ledger Entry
      const existingLedger = await tx.stockLedger.findFirst({
        where: { tenantId, locationId, productId, batchNo }
      });

      if (existingLedger) {
        const newQty = existingLedger.quantity.add(quantityChange);
        if (newQty.lessThan(0)) {
            throw new Error("Insufficient stock for this outward adjustment.");
        }
        
        // Update existing ledger
        await tx.stockLedger.update({
          where: { id: existingLedger.id },
          data: {
            quantity: newQty,
            costPrice: costPrice > 0 ? new Prisma.Decimal(costPrice) : existingLedger.costPrice
          }
        });
      } else {
        if (quantityChange.lessThan(0)) {
            throw new Error("Cannot make outward adjustment. No existing stock ledger found.");
        }
        
        // Create new ledger entry
        await tx.stockLedger.create({
          data: {
            tenantId,
            locationId,
            productId,
            batchNo,
            quantity: quantityChange,
            costPrice: new Prisma.Decimal(costPrice)
          }
        });
      }

      // 3. Create Movement History
      await tx.stockMovement.create({
        data: {
          tenantId,
          movementType: mType,
          referenceType,
          referenceId: referenceIdStr ? parseInt(referenceIdStr) : null,
          fromLocationId: mType === MovementType.adjustment_out ? locationId : null,
          toLocationId: (mType === MovementType.adjustment_in || mType === MovementType.opening_stock) ? locationId : null,
          productId,
          quantity: new Prisma.Decimal(rawQuantity),
          performedById: userId
        }
      });
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to adjust stock." };
  }
}
