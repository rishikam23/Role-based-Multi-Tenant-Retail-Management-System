"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { TransferStatus, MovementType, Prisma } from "@prisma/client";

export async function createTransfer(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  const fromLocationId = parseInt(formData.get("fromLocationId") as string);
  const toLocationId = parseInt(formData.get("toLocationId") as string);
  const productId = parseInt(formData.get("productId") as string);
  const quantity = parseFloat(formData.get("quantity") as string);
  
  if (fromLocationId === toLocationId) {
    return { error: "Source and Destination locations must be different." };
  }
  
  if (isNaN(quantity) || quantity <= 0) {
    return { error: "Valid positive quantity is required." };
  }

  try {
    const transferNo = `TRN-${Date.now().toString().slice(-6)}`;
    
    await prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNo,
        fromLocationId,
        toLocationId,
        transferDate: new Date(),
        status: TransferStatus.draft,
        createdById: userId,
        items: {
          create: [{
            productId,
            requestedQty: new Prisma.Decimal(quantity)
          }]
        }
      }
    });

    revalidatePath("/dashboard/transfers");
    return { success: true };
  } catch (error: any) {
    return { error: "Failed to create transfer request." };
  }
}

export async function dispatchTransfer(transferId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId, tenantId },
        include: { items: true }
      });

      if (!transfer || transfer.status !== TransferStatus.draft) {
        throw new Error("Transfer not found or not in draft status.");
      }

      for (const item of transfer.items) {
        // 1. Check Source Ledger
        const sourceLedger = await tx.stockLedger.findFirst({
          where: { tenantId, locationId: transfer.fromLocationId, productId: item.productId }
        });

        if (!sourceLedger || sourceLedger.quantity.lessThan(item.requestedQty)) {
          throw new Error("Insufficient stock at source location to dispatch.");
        }

        // 2. Deduct from Source Ledger
        await tx.stockLedger.update({
          where: { id: sourceLedger.id },
          data: { quantity: sourceLedger.quantity.sub(item.requestedQty) }
        });

        // 3. Log Movement (Transfer Out)
        await tx.stockMovement.create({
          data: {
            tenantId,
            movementType: MovementType.transfer_out,
            referenceType: "Stock Transfer",
            referenceId: transfer.id,
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            productId: item.productId,
            quantity: item.requestedQty.mul(-1),
            performedById: userId
          }
        });

        // 4. Update Item Dispatched Qty
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { dispatchedQty: item.requestedQty }
        });
      }

      // 5. Update Transfer Status
      await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.in_transit }
      });
    });

    revalidatePath("/dashboard/transfers");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to dispatch transfer." };
  }
}

export async function receiveTransfer(transferId: number) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!tenantId || !userId) return { error: "Unauthorized" };

  try {
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.stockTransfer.findUnique({
        where: { id: transferId, tenantId },
        include: { items: true }
      });

      if (!transfer || transfer.status !== TransferStatus.in_transit) {
        throw new Error("Transfer not found or not in transit.");
      }

      for (const item of transfer.items) {
        const receivedQty = item.dispatchedQty || item.requestedQty;

        // 1. Find or Create Destination Ledger
        const destLedger = await tx.stockLedger.findFirst({
          where: { tenantId, locationId: transfer.toLocationId, productId: item.productId }
        });

        if (destLedger) {
          await tx.stockLedger.update({
            where: { id: destLedger.id },
            data: { quantity: destLedger.quantity.add(receivedQty) }
          });
        } else {
          // Find source cost to pass it over, fallback to 0
          const sourceLedger = await tx.stockLedger.findFirst({
             where: { tenantId, locationId: transfer.fromLocationId, productId: item.productId }
          });
          await tx.stockLedger.create({
            data: {
              tenantId,
              locationId: transfer.toLocationId,
              productId: item.productId,
              quantity: receivedQty,
              costPrice: sourceLedger?.costPrice || new Prisma.Decimal(0)
            }
          });
        }

        // 2. Log Movement (Transfer In)
        await tx.stockMovement.create({
          data: {
            tenantId,
            movementType: MovementType.transfer_in,
            referenceType: "Stock Transfer",
            referenceId: transfer.id,
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            productId: item.productId,
            quantity: receivedQty,
            performedById: userId
          }
        });

        // 3. Update Item Received Qty
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: { receivedQty }
        });
      }

      // 4. Update Transfer Status
      await tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: TransferStatus.received }
      });
    });

    revalidatePath("/dashboard/transfers");
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to receive transfer." };
  }
}
