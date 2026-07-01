"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

export async function getExpectedSales(locationId: number, dateStr: string) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  if (!tenantId) return { error: "Unauthorized" };

  if (isNaN(locationId) || !dateStr) {
    return { error: "Invalid location or date" };
  }

  try {
    const targetDate = new Date(dateStr);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const sales = await prisma.salesOrder.findMany({
      where: {
        tenantId,
        locationId,
        saleDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ["confirmed", "partially_returned", "returned"],
        },
      },
      select: {
        paymentMethod: true,
        grandTotal: true,
      },
    });

    let cashSales = 0;
    let momoSales = 0;
    let cardSales = 0;

    sales.forEach((s) => {
      const amount = Number(s.grandTotal);
      if (s.paymentMethod === "cash") {
        cashSales += amount;
      } else if (s.paymentMethod === "mobile_money") {
        momoSales += amount;
      } else {
        cardSales += amount;
      }
    });

    const returns = await prisma.salesReturn.findMany({
      where: {
        tenantId,
        salesOrder: {
          locationId,
        },
        returnDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "approved",
      },
      select: {
        totalRefunded: true,
      },
    });

    const refunds = returns.reduce((sum, r) => sum + Number(r.totalRefunded), 0);

    return {
      success: true,
      cashSales,
      momoSales,
      cardSales,
      refunds,
    };
  } catch (error: any) {
    return { error: error.message || "Failed to calculate expected sales" };
  }
}

export async function submitCashUp(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  if (!tenantId || !userId) return { error: "Unauthorized" };

  const locationId = parseInt(formData.get("locationId") as string);
  const dateStr = formData.get("date") as string;
  const openingBalance = parseFloat(formData.get("openingBalance") as string || "0");
  const pettyCashIn = parseFloat(formData.get("pettyCashIn") as string || "0");
  const pettyCashOut = parseFloat(formData.get("pettyCashOut") as string || "0");
  const pettyCashNotes = formData.get("pettyCashNotes") as string || null;
  const actualClosing = parseFloat(formData.get("actualClosing") as string || "0");
  const notes = formData.get("notes") as string || null;
  const otpCode = formData.get("otpCode") as string;

  if (isNaN(locationId) || !dateStr) {
    return { error: "Location and Date are required." };
  }

  if (isNaN(openingBalance) || openingBalance < 0) {
    return { error: "Valid opening balance is required." };
  }

  if (isNaN(actualClosing) || actualClosing < 0) {
    return { error: "Valid physical closing cash counted is required." };
  }

  if (!otpCode || otpCode.trim().length === 0) {
    return { error: "Supervisor OTP verification code is required." };
  }

  try {
    const expectedData = await getExpectedSales(locationId, dateStr);
    if ("error" in expectedData) {
      return { error: expectedData.error };
    }

    const { cashSales, momoSales, cardSales, refunds } = expectedData;

    const expectedClosing = openingBalance + cashSales + pettyCashIn - pettyCashOut - refunds;
    const discrepancy = actualClosing - expectedClosing;

    await prisma.eodCashUp.create({
      data: {
        tenantId,
        locationId,
        cashierId: userId,
        date: new Date(dateStr),
        openingBalance: new Prisma.Decimal(openingBalance),
        cashSales: new Prisma.Decimal(cashSales),
        momoSales: new Prisma.Decimal(momoSales),
        cardSales: new Prisma.Decimal(cardSales),
        pettyCashIn: new Prisma.Decimal(pettyCashIn),
        pettyCashOut: new Prisma.Decimal(pettyCashOut),
        pettyCashNotes,
        refunds: new Prisma.Decimal(refunds),
        expectedClosing: new Prisma.Decimal(expectedClosing),
        actualClosing: new Prisma.Decimal(actualClosing),
        discrepancy: new Prisma.Decimal(discrepancy),
        notes,
        status: "verified",
        otpCode,
      },
    });

    revalidatePath("/dashboard/cashups");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "A Cash Up report has already been submitted for this location on this date." };
    }
    return { error: error.message || "Failed to submit cash up." };
  }
}