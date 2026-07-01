"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { PurchaseOrderStatus, MovementType, Prisma } from "@prisma/client";

export async function createPO(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  const supplierId = parseInt(formData.get("supplierId") as string);
  const locationId = parseInt(formData.get("locationId") as string);
  const productId = parseInt(formData.get("productId") as string);
  const quantity = parseFloat(formData.get("quantity") as string);
  const unitCost = parseFloat(formData.get("unitCost") as string);
  
  if (isNaN(supplierId) || isNaN(locationId) || isNaN(productId)) {
    return { error: "Supplier, Location, and Product are required." };
  }
  
  if (isNaN(quantity) || quantity <= 0 || isNaN(unitCost) || unitCost < 0) {
    return { error: "Valid quantity and positive unit cost are required." };
  }

  try {
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    
    await prisma.purchaseOrder.create({
      data: {
        tenantId,
        poNumber,
        supplierId,
        receivingLocationId: locationId,
        orderDate: new Date(),
        status: PurchaseOrderStatus.draft,
        subtotal: new Prisma.Decimal(quantity * unitCost),
        grandTotal: new Prisma.Decimal(quantity * unitCost),
        createdById: userId,
        items: {
          create: [{
            tenantId,
            productId,
            orderedQty: new Prisma.Decimal(quantity),
            unitCost: new Prisma.Decimal(unitCost),
            lineTotal: new Prisma.Decimal(quantity * unitCost)
          }]
        }
      }
    });

    revalidatePath("/dashboard/purchases");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to create Purchase Order." };
  }
}

export async function approvePO(poId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  
  if (!tenantId) return { error: "Unauthorized" };

  try {
    await prisma.purchaseOrder.update({
      where: { id: poId, tenantId },
      data: { status: PurchaseOrderStatus.approved }
    });

    revalidatePath("/dashboard/purchases");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to approve PO." };
  }
}

export async function receivePO(poId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId, tenantId },
        include: { items: true }
      });

      if (!po || po.status !== PurchaseOrderStatus.approved) {
        throw new Error("PO not found or not in approved status.");
      }

      for (const item of po.items) {
        const receivedQty = item.orderedQty; // Assuming full receipt for now

        // 1. Find or Create Destination Ledger
        const destLedger = await tx.stockLedger.findFirst({
          where: { tenantId, locationId: po.receivingLocationId, productId: item.productId }
        });

        if (destLedger) {
          await tx.stockLedger.update({
            where: { id: destLedger.id },
            data: { 
              quantity: destLedger.quantity.add(receivedQty),
              // Optional: Update to moving average cost here, for now override
              costPrice: item.unitCost
            }
          });
        } else {
          await tx.stockLedger.create({
            data: {
              tenantId,
              locationId: po.receivingLocationId,
              productId: item.productId,
              quantity: receivedQty,
              costPrice: item.unitCost
            }
          });
        }

        // 2. Log Movement (Purchase Receipt)
        await tx.stockMovement.create({
          data: {
            tenantId,
            movementType: MovementType.purchase_receipt,
            referenceType: "Purchase Order",
            referenceId: po.id,
            toLocationId: po.receivingLocationId,
            productId: item.productId,
            quantity: receivedQty,
            performedById: userId
          }
        });

        // 3. Update Item Received Qty
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQty }
        });
      }

      // 4. Update PO Status
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: PurchaseOrderStatus.received }
      });
    });

    revalidatePath("/dashboard/purchases");
    revalidatePath("/dashboard/inventory");
    revalidatePath("/dashboard/movements");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to receive PO." };
  }
}
