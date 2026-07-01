import { PrismaClient, UserType, LocationType, ProductType, MovementType, PurchaseOrderStatus, SaleStatus, PaymentMethod, ReturnStatus, TransferStatus, AuditUserType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper for random choices
const randomEl = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDecimal = (min: number, max: number) => +(Math.random() * (max - min) + min).toFixed(2);

async function main() {
  console.log("Seeding database with massive multi-tenant realistic data...");

  // Clean up
  await prisma.eodCashUp.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.stockTransferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.salesReturn.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.stockLedger.deleteMany();
  await prisma.product.deleteMany();
  await prisma.unitOfMeasure.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.userLocationAccess.deleteMany();
  await prisma.location.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.masterAdmin.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. Master Admin
  const masterAdmin = await prisma.masterAdmin.create({
    data: { fullName: 'System Owner', email: 'admin@system.com', username: 'admin', passwordHash: hashedPassword, isActive: true },
  });

  const tenantConfigs = [
    { code: 'KWL', name: 'Kookwell Retail Management', prefix: 'kookwell' },
    { code: 'FMS', name: 'FreshMart Supermarkets', prefix: 'freshmart' },
    { code: 'THE', name: 'TechHaven Electronics', prefix: 'techhaven' },
    { code: 'ZNA', name: 'Zenith Apparel', prefix: 'zenith' },
    { code: 'UGD', name: 'Urban Goods Depot', prefix: 'urbangoods' }
  ];

  for (const tConfig of tenantConfigs) {
    console.log(`Generating BULK data for tenant: ${tConfig.name}...`);
    
    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: tConfig.code,
        companyName: tConfig.name,
        email: `contact@${tConfig.prefix}.com`,
        phone: '+1-555-' + randomInt(1000, 9999),
        timezone: 'America/New_York',
        currencyCode: 'USD',
        currencySymbol: '$',
        managedById: masterAdmin.id,
      },
    });

    await prisma.auditLog.create({
      data: { tenantId: tenant.id, userId: masterAdmin.id, userType: AuditUserType.master_admin, action: 'CREATE', entity: 'Tenant', entityId: tenant.id, newValues: { name: tConfig.name } }
    });

    // Roles
    const adminRole = await prisma.role.create({ data: { tenantId: tenant.id, roleName: 'Store Manager', isSystem: true } });
    const cashierRole = await prisma.role.create({ data: { tenantId: tenant.id, roleName: 'Cashier', isSystem: true } });

    // Locations (6 per tenant)
    const locations: any[] = [];
    const locNames = ['HQ', 'Downtown Branch', 'Uptown Store', 'Westside Kiosk', 'Eastside Depot', 'North Branch'];
    const locTypes = [LocationType.depot, LocationType.branch, LocationType.store, LocationType.kiosk, LocationType.depot, LocationType.branch];
    
    for (let i = 0; i < 6; i++) {
      const loc = await prisma.location.create({
        data: { tenantId: tenant.id, locationCode: `${tConfig.code}-L${i+1}`, locationName: locNames[i], locationType: locTypes[i] }
      });
      locations.push(loc);
    }

    // Users (1 Super Admin, 3 Members - As requested, keeping people count same)
    const superAdmin = await prisma.user.create({
      data: { tenantId: tenant.id, roleId: adminRole.id, userType: UserType.super_admin, firstName: 'Admin', lastName: tConfig.name, username: `admin@${tConfig.prefix}.com`, email: `admin@${tConfig.prefix}.com`, passwordHash: hashedPassword }
    });

    const members: any[] = [];
    for (let i = 1; i <= 3; i++) {
      const member = await prisma.user.create({
        data: { tenantId: tenant.id, roleId: cashierRole.id, userType: UserType.member, firstName: 'Worker', lastName: `${i}`, username: `worker${i}@${tConfig.prefix}.com`, email: `worker${i}@${tConfig.prefix}.com`, passwordHash: hashedPassword }
      });
      members.push(member);
    }

    // Location Access (Admin gets all, workers get random 3)
    const accessData = locations.map(l => ({ userId: superAdmin.id, locationId: l.id }));
    members.forEach(m => {
      accessData.push({ userId: m.id, locationId: locations[0].id });
      accessData.push({ userId: m.id, locationId: locations[1].id });
      accessData.push({ userId: m.id, locationId: locations[2].id });
    });
    await prisma.userLocationAccess.createMany({ data: accessData });

    // 10 Suppliers
    const suppliers: any[] = [];
    for (let i = 1; i <= 10; i++) {
      const s = await prisma.supplier.create({
        data: { tenantId: tenant.id, supplierName: `${tConfig.name} Supplier ${i}`, contactPerson: `Contact ${i}`, email: `sup${i}@example.com`, phone: `+1-555-${randomInt(1000,9999)}` }
      });
      suppliers.push(s);
    }

    // 15 Categories
    const categories: any[] = [];
    const catNames = ['Electronics', 'Clothing', 'Groceries', 'Beverages', 'Home Goods', 'Toys', 'Books', 'Tools', 'Stationery', 'Automotive', 'Beauty', 'Sports', 'Garden', 'Pets', 'Music'];
    for (const cn of catNames) {
      const c = await prisma.category.create({ data: { tenantId: tenant.id, categoryName: cn } });
      categories.push(c);
    }

    // 5 UOMs
    const uoms: any[] = [];
    const uomData = [{c: 'PCS', n: 'Pieces'}, {c: 'KG', n: 'Kilograms'}, {c: 'BOX', n: 'Boxes'}, {c: 'LIT', n: 'Liters'}, {c: 'PKT', n: 'Packets'}];
    for (const u of uomData) {
      const uom = await prisma.unitOfMeasure.create({ data: { tenantId: tenant.id, uomCode: u.c, uomName: u.n } });
      uoms.push(uom);
    }

    // 50 Products
    const products: any[] = [];
    for (let i = 1; i <= 50; i++) {
      const cost = randomDecimal(5, 100);
      const sell = cost * randomDecimal(1.2, 2.5);
      const p = await prisma.product.create({
        data: {
          tenantId: tenant.id,
          categoryId: randomEl(categories).id,
          uomId: randomEl(uoms).id,
          sku: `${tConfig.code}-PRD-${String(i).padStart(3, '0')}`,
          productName: `Product ${i} Premium`,
          costPrice: cost,
          sellingPrice: sell,
          reorderLevel: randomInt(10, 50),
        }
      });
      products.push(p);

      if (i <= 5) { // Only log 5 to avoid blowing up DB
        await prisma.auditLog.create({
          data: { tenantId: tenant.id, userId: superAdmin.id, userType: AuditUserType.super_admin, action: 'CREATE', entity: 'Product', entityId: p.id, newValues: { sku: p.sku } }
        });
      }
    }

    // Stock Ledger & Movements (Opening Stock for all products in all locations)
    console.log(`  -> Initializing stock for ${products.length} products across ${locations.length} locations...`);
    for (const p of products) {
      for (const l of locations) {
        const qty = randomInt(50, 500);
        await prisma.stockLedger.create({
          data: { tenantId: tenant.id, locationId: l.id, productId: p.id, quantity: qty, costPrice: p.costPrice }
        });
        await prisma.stockMovement.create({
          data: { tenantId: tenant.id, movementType: MovementType.opening_stock, productId: p.id, quantity: qty, performedById: superAdmin.id, toLocationId: l.id }
        });
      }
    }

    // 20 Customers
    const customers: any[] = [];
    for (let i = 1; i <= 20; i++) {
      const c = await prisma.customer.create({
        data: { tenantId: tenant.id, fullName: `Customer ${i}`, email: `cust${i}@mail.com`, phone: `+1-555-${randomInt(1000,9999)}` }
      });
      customers.push(c);
    }

    // 40 Purchase Orders
    console.log(`  -> Creating 40 Purchase Orders...`);
    const poStatuses = [PurchaseOrderStatus.received, PurchaseOrderStatus.partially_received, PurchaseOrderStatus.cancelled, PurchaseOrderStatus.approved, PurchaseOrderStatus.submitted];
    for (let i = 1; i <= 40; i++) {
      const sId = randomEl(suppliers).id;
      const lId = randomEl(locations).id;
      const status = randomEl(poStatuses);
      const itemsCount = randomInt(1, 5);
      const poItems = [];
      let total = 0;

      for (let j = 0; j < itemsCount; j++) {
        const p = randomEl(products);
        const qty = randomInt(10, 100);
        const rcvQty = status === PurchaseOrderStatus.received ? qty : (status === PurchaseOrderStatus.partially_received ? Math.floor(qty/2) : 0);
        const lineTot = qty * Number(p.costPrice);
        total += lineTot;
        poItems.push({
          tenantId: tenant.id,
          productId: p.id,
          orderedQty: qty,
          receivedQty: rcvQty,
          unitCost: p.costPrice,
          lineTotal: lineTot
        });
      }

      const po = await prisma.purchaseOrder.create({
        data: {
          tenantId: tenant.id, poNumber: `${tConfig.code}-PO-${String(i).padStart(3, '0')}`, supplierId: sId, receivingLocationId: lId,
          orderDate: new Date(Date.now() - randomInt(1, 30) * 86400000),
          status: status, subtotal: total, grandTotal: total, createdById: superAdmin.id,
          items: { create: poItems }
        }
      });

      // If received, update stock
      if (status === PurchaseOrderStatus.received || status === PurchaseOrderStatus.partially_received) {
        for (const item of poItems) {
          if (item.receivedQty > 0) {
            await prisma.stockLedger.updateMany({
              where: { tenantId: tenant.id, locationId: lId, productId: item.productId },
              data: { quantity: { increment: item.receivedQty } }
            });
            await prisma.stockMovement.create({
              data: { tenantId: tenant.id, movementType: MovementType.purchase_receipt, referenceType: 'purchase_order', referenceId: po.id, toLocationId: lId, productId: item.productId, quantity: item.receivedQty, performedById: superAdmin.id }
            });
          }
        }
      }
    }

    // 80 Sales Orders
    console.log(`  -> Creating 80 Sales Orders...`);
    const soStatuses = [SaleStatus.confirmed, SaleStatus.cancelled, SaleStatus.draft];
    const payMethods = [PaymentMethod.cash, PaymentMethod.card, PaymentMethod.mobile_money];
    const salesOrders: any[] = [];
    for (let i = 1; i <= 80; i++) {
      const lId = randomEl(locations).id;
      const cId = randomEl(customers).id;
      const uId = randomEl(members).id;
      const status = randomEl(soStatuses);
      const itemsCount = randomInt(1, 5);
      const soItems = [];
      let total = 0;

      for (let j = 0; j < itemsCount; j++) {
        const p = randomEl(products);
        const qty = randomInt(1, 5);
        const lineTot = qty * Number(p.sellingPrice);
        total += lineTot;
        soItems.push({ tenantId: tenant.id, productId: p.id, quantity: qty, unitPrice: p.sellingPrice, lineTotal: lineTot });
      }

      const so = await prisma.salesOrder.create({
        data: {
          tenantId: tenant.id, invoiceNo: `${tConfig.code}-INV-${String(i).padStart(4, '0')}`, locationId: lId, customerId: cId, cashierId: uId,
          saleDate: new Date(Date.now() - randomInt(1, 15) * 86400000),
          status: status, paymentMethod: randomEl(payMethods), subtotal: total, grandTotal: total,
          items: { create: soItems }
        }
      });
      salesOrders.push(so);

      // If confirmed, update stock
      if (status === SaleStatus.confirmed) {
        for (const item of soItems) {
          await prisma.stockLedger.updateMany({
            where: { tenantId: tenant.id, locationId: lId, productId: item.productId },
            data: { quantity: { decrement: item.quantity } }
          });
          await prisma.stockMovement.create({
            data: { tenantId: tenant.id, movementType: MovementType.sale, referenceType: 'sales_order', referenceId: so.id, fromLocationId: lId, productId: item.productId, quantity: item.quantity, performedById: uId }
          });
        }
      }
    }

    // 15 Sales Returns
    console.log(`  -> Creating 15 Sales Returns...`);
    for (let i = 1; i <= 15; i++) {
      const so = randomEl(salesOrders.filter((s: any) => s.status === SaleStatus.confirmed));
      if (!so) continue;

      const ret = await prisma.salesReturn.create({
        data: {
          tenantId: tenant.id,
          salesOrderId: so.id,
          returnNo: `${tConfig.code}-RET-${String(i).padStart(3, '0')}`,
          returnReason: randomEl(['Damaged', 'Wrong Item', 'Customer Changed Mind', 'Defective']),
          totalRefunded: so.grandTotal,
          status: ReturnStatus.completed,
          processedById: superAdmin.id,
        }
      });

      // Find an item from the original order to refund stock
      const soItems = await prisma.salesOrderItem.findMany({ where: { salesOrderId: so.id } });
      if (soItems.length > 0) {
        for (const item of soItems) {
          await prisma.stockLedger.updateMany({
            where: { tenantId: tenant.id, locationId: so.locationId, productId: item.productId },
            data: { quantity: { increment: item.quantity } }
          });
          await prisma.stockMovement.create({
            data: { tenantId: tenant.id, movementType: MovementType.return_from_customer, referenceType: 'sales_return', referenceId: ret.id, toLocationId: so.locationId, productId: item.productId, quantity: item.quantity, performedById: superAdmin.id }
          });
        }
      }
    }

    // 15 Stock Transfers
    console.log(`  -> Creating 15 Stock Transfers...`);
    for (let i = 1; i <= 15; i++) {
      const fromL = randomEl(locations);
      const toL = randomEl(locations.filter(l => l.id !== fromL.id));
      const p = randomEl(products);
      const qty = randomInt(10, 50);

      const st = await prisma.stockTransfer.create({
        data: {
          tenantId: tenant.id, transferNo: `${tConfig.code}-TRF-${String(i).padStart(3, '0')}`, fromLocationId: fromL.id, toLocationId: toL.id,
          transferDate: new Date(), status: TransferStatus.received, createdById: superAdmin.id,
          items: { create: [{ productId: p.id, requestedQty: qty, dispatchedQty: qty, receivedQty: qty }] }
        }
      });

      // Stock out of fromL
      await prisma.stockLedger.updateMany({
        where: { tenantId: tenant.id, locationId: fromL.id, productId: p.id },
        data: { quantity: { decrement: qty } }
      });
      await prisma.stockMovement.create({
        data: { tenantId: tenant.id, movementType: MovementType.transfer_out, referenceType: 'stock_transfer', referenceId: st.id, fromLocationId: fromL.id, productId: p.id, quantity: qty, performedById: superAdmin.id }
      });

      // Stock into toL
      await prisma.stockLedger.updateMany({
        where: { tenantId: tenant.id, locationId: toL.id, productId: p.id },
        data: { quantity: { increment: qty } }
      });
      await prisma.stockMovement.create({
        data: { tenantId: tenant.id, movementType: MovementType.transfer_in, referenceType: 'stock_transfer', referenceId: st.id, toLocationId: toL.id, productId: p.id, quantity: qty, performedById: superAdmin.id }
      });
    }

    // 20 EOD CashUps (spread across locations)
    console.log(`  -> Creating 20 EOD CashUps...`);
    for (let i = 1; i <= 20; i++) {
      const l = randomEl(locations);
      const u = randomEl(members);
      const sales = randomDecimal(100, 2000);
      
      await prisma.eodCashUp.create({
        data: {
          tenantId: tenant.id, locationId: l.id, cashierId: u.id, date: new Date(Date.now() - randomInt(1, 20) * 86400000),
          openingBalance: 100, cashSales: sales * 0.4, momoSales: sales * 0.2, cardSales: sales * 0.4,
          expectedClosing: 100 + sales, actualClosing: 100 + sales, discrepancy: 0, status: 'verified'
        }
      }).catch(() => {}); // Catch unique constraint if same day/loc generated
    }
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })