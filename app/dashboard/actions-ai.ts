"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { formatCurrency } from "./reports/helpers";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askLocalAssistant(query: string, history: ChatMessage[]) {
  try {
    const session = await auth();
    const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
    const isMaster = session?.user?.userType === "master_admin";

    if (!tenantId && !isMaster) {
      return "Security Block: You must be signed in and associated with an organization to query the AI assistant.";
    }

    const targetTenantId = tenantId || 1; 

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      totalLocations,
      totalSuppliers,
      todaySales,
      ledgers,
      tenantDetails
    ] = await Promise.all([
      prisma.product.count({ where: { tenantId: targetTenantId } }),
      prisma.location.count({ where: { tenantId: targetTenantId, isActive: true } }),
      prisma.supplier.count({ where: { tenantId: targetTenantId, isActive: true } }),
      prisma.salesOrder.aggregate({
        where: { tenantId: targetTenantId, status: "confirmed", saleDate: { gte: today } },
        _sum: { grandTotal: true },
        _count: { id: true },
      }),
      prisma.stockLedger.findMany({
        where: { tenantId: targetTenantId },
        include: { product: true, location: true },
      }),
      prisma.tenant.findUnique({
        where: { id: targetTenantId },
        select: { currencySymbol: true, companyName: true },
      }),
    ]);

    const symbol = tenantDetails?.currencySymbol || "$";
    const companyName = tenantDetails?.companyName || "Our Retail Organization";

    const lowStockItems = ledgers.filter((l) => Number(l.quantity) <= l.product.reorderLevel && Number(l.quantity) > 0);
    const outOfStockItems = ledgers.filter((l) => Number(l.quantity) === 0);
    const totalStockValue = ledgers.reduce((sum, l) => sum + Number(l.quantity) * Number(l.costPrice), 0);
    const lowStockSummary = lowStockItems.slice(0, 5).map(
      (l) => `- ${l.product.productName} (SKU: ${l.product.sku}) at ${l.location.locationName}: Qty ${Number(l.quantity)} (Reorder Level: ${l.product.reorderLevel})`
    ).join("\n");

    const outOfStockSummary = outOfStockItems.slice(0, 5).map(
      (l) => `- ${l.product.productName} (SKU: ${l.product.sku}) at ${l.location.locationName}`
    ).join("\n");

    const systemContext = `
You are the dedicated AI Retail Assistant for "${companyName}".
You have secure access to the following real-time inventory and database parameters:
- Active Products in Catalog: ${totalProducts}
- Active Physical Locations: ${totalLocations}
- Active Suppliers: ${totalSuppliers}
- Today's Sales Count: ${todaySales._count.id} transactions
- Today's Revenue: ${formatCurrency(Number(todaySales._sum.grandTotal ?? 0), symbol)}
- Combined Inventory Asset Valuation: ${formatCurrency(totalStockValue, symbol)}
- Total Low Stock Warning Count: ${lowStockItems.length} items
- Total Out of Stock Count: ${outOfStockItems.length} items

Low Stock Items List (Max 5 shown):
${lowStockSummary || "No low stock warnings. All items satisfy reorder levels."}

Out of Stock Items List (Max 5 shown):
${outOfStockSummary || "All items currently have stock available."}

Guidelines:
1. Always reply in clean, direct, and professional markdown.
2. Only answer queries within the scope of this business metrics context. If a user asks about general facts, politely decline.
3. Be concise and keep summaries structured with bullets.
`;

    try {
      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "mistral",
          prompt: `${systemContext}\n\nUser Question: ${query}\n\nAssistant Response:`,
          stream: false,
          options: {
            temperature: 0.3
          }
        }),
        signal: AbortSignal.timeout(6000) 
      });

      if (response.ok) {
        const body = await response.json();
        return body.response;
      }
    } catch (ollamaErr) {
    }

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes("sales") || lowerQuery.includes("revenue") || lowerQuery.includes("finance") || lowerQuery.includes("earned") || lowerQuery.includes("money")) {
      return `### Today's Financial Performance Summary
*   **Total Billing Count:** ${todaySales._count.id} successfully confirmed invoices.
*   **Gross Daily Revenue:** **${formatCurrency(Number(todaySales._sum.grandTotal ?? 0), symbol)}**
*   **Total Asset Valuation:** ${formatCurrency(totalStockValue, symbol)}

*(Note: Direct query extracted from database. Ollama local model is currently offline. Start Ollama to enable conversational natural language analysis.)*`;
    }

    if (lowerQuery.includes("low") || lowerQuery.includes("stock") || lowerQuery.includes("warning") || lowerQuery.includes("reorder") || lowerQuery.includes("depleted") || lowerQuery.includes("alert")) {
      let response = `### Inventory Stock Status Report
*   **Low Stock Warnings:** ${lowStockItems.length} SKUs currently below reorder levels.
*   **Out of Stock Items:** ${outOfStockItems.length} SKUs showing zero quantity.

`;
      if (lowStockItems.length > 0) {
        response += `#### Critical Low Stock Warnings (Below Reorder Point):\n` + lowStockSummary + "\n\n";
      }
      if (outOfStockItems.length > 0) {
        response += `#### Depleted Items (Out of Stock):\n` + outOfStockSummary + "\n\n";
      }
      return response + `*(Note: Direct query extracted from database. Ollama local model is currently offline.)*`;
    }

    if (lowerQuery.includes("product") || lowerQuery.includes("how many") || lowerQuery.includes("count") || lowerQuery.includes("catalog") || lowerQuery.includes("store") || lowerQuery.includes("location") || lowerQuery.includes("supplier")) {
      return `### Platform Resource Audit
*   **Cataloged Products:** ${totalProducts} unique SKUs.
*   **Operational Branches:** ${totalLocations} stores/depots.
*   **Registered Suppliers:** ${totalSuppliers} business partners.
*   **Capital Assets Value:** ${formatCurrency(totalStockValue, symbol)}`;
    }

    return `### Hello! I am your Local AI Assistant
I am currently operating in **Offline Fallback Mode** because your local Ollama server is not running or accessible. 

Even while offline, I can fetch real-time database details. Try clicking one of the options below or ask me about:
1. **Sales & Revenue:** *"What is today's revenue?"*
2. **Stock Warnings:** *"Show me low stock items"*
3. **Store Stats:** *"How many products and locations do we have?"*

---
*To activate conversational natural language, please download and run **Ollama** locally (details on how to set it up are in the main chat).*`;

  } catch (error: any) {
    return `An error occurred while communicating with the inventory database: ${error.message}`;
  }
}
