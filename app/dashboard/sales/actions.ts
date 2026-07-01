"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SaleStatus, PaymentMethod, MovementType, Prisma } from "@prisma/client";

export async function createSale(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  const locationId = parseInt(formData.get("locationId") as string);
  const productId = parseInt(formData.get("productId") as string);
  const quantity = parseFloat(formData.get("quantity") as string);
  const paymentMethodStr = formData.get("paymentMethod") as string;
  
  let paymentMethod: PaymentMethod = PaymentMethod.cash;
  if (Object.values(PaymentMethod).includes(paymentMethodStr as PaymentMethod)) {
    paymentMethod = paymentMethodStr as PaymentMethod;
  }

  if (isNaN(locationId) || isNaN(productId)) {
    return { error: "Location and Product are required." };
  }
  
  if (isNaN(quantity) || quantity <= 0) {
    return { error: "Valid positive quantity is required." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Fetch Product to get the Selling Price
      const product = await tx.product.findUnique({
        where: { id: productId, tenantId }
      });

      if (!product) throw new Error("Product not found.");

      const unitPrice = product.sellingPrice;
      const lineTotal = new Prisma.Decimal(quantity).mul(unitPrice);

      // 2. Check Stock Ledger
      const stockLedger = await tx.stockLedger.findFirst({
        where: { tenantId, locationId, productId }
      });

      if (!stockLedger || stockLedger.quantity.lessThan(quantity)) {
        throw new Error("Insufficient stock available at this location to complete the sale.");
      }

      // 3. Deduct Stock
      await tx.stockLedger.update({
        where: { id: stockLedger.id },
        data: { quantity: stockLedger.quantity.sub(quantity) }
      });

      // 4. Create Sales Order & Items
      const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
      
      const salesOrder = await tx.salesOrder.create({
        data: {
          tenantId,
          invoiceNo,
          locationId,
          cashierId: userId,
          status: SaleStatus.confirmed,
          paymentMethod,
          subtotal: lineTotal,
          grandTotal: lineTotal,
          items: {
            create: [{
              tenantId,
              productId,
              quantity: new Prisma.Decimal(quantity),
              unitPrice,
              lineTotal
            }]
          }
        }
      });

      // 5. Log Movement (Sale)
      await tx.stockMovement.create({
        data: {
          tenantId,
          movementType: MovementType.sale,
          referenceType: "Sales Invoice",
          referenceId: salesOrder.id,
          fromLocationId: locationId,
          productId,
          quantity: new Prisma.Decimal(quantity).mul(-1), // Outward movement
          performedById: userId
        }
      });
    });

    revalidatePath("/dashboard/sales");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to process sale." };
  }
}
