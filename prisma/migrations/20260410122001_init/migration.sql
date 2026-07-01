CREATE TYPE "UserType" AS ENUM ('master_admin', 'super_admin', 'member');

CREATE TYPE "LocationType" AS ENUM ('store', 'branch', 'depot', 'kiosk');

CREATE TYPE "ProductType" AS ENUM ('physical', 'service', 'digital');

CREATE TYPE "MovementType" AS ENUM ('purchase_receipt', 'sale', 'adjustment_in', 'adjustment_out', 'transfer_out', 'transfer_in', 'return_from_customer', 'return_to_supplier', 'opening_stock');

CREATE TYPE "PurchaseOrderStatus" AS ENUM ('draft', 'submitted', 'approved', 'partially_received', 'received', 'cancelled');

CREATE TYPE "SaleStatus" AS ENUM ('draft', 'confirmed', 'partially_returned', 'returned', 'cancelled');

CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card', 'bank_transfer', 'mobile_money', 'credit', 'mixed');

CREATE TYPE "ReturnStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');

CREATE TYPE "TransferStatus" AS ENUM ('draft', 'in_transit', 'received', 'cancelled');

CREATE TYPE "AuditUserType" AS ENUM ('master_admin', 'super_admin', 'member', 'system');

CREATE TABLE "master_admin" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_admin_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "tenantCode" VARCHAR(32) NOT NULL,
    "companyName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(191),
    "phone" VARCHAR(30),
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'UTC',
    "currencyCode" VARCHAR(10) NOT NULL DEFAULT 'USD',
    "currencySymbol" VARCHAR(10) NOT NULL DEFAULT '$',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "managedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "module" VARCHAR(80) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "displayName" VARCHAR(150) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "roleName" VARCHAR(100) NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER,
    "roleId" INTEGER,
    "userType" "UserType" NOT NULL DEFAULT 'member',
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "phone" VARCHAR(30),
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_sessions" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tenantId" INTEGER,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "locationCode" VARCHAR(30) NOT NULL,
    "locationName" VARCHAR(200) NOT NULL,
    "locationType" "LocationType" NOT NULL DEFAULT 'store',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "user_location_access" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_location_access_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "suppliers" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "supplierName" VARCHAR(255) NOT NULL,
    "contactPerson" VARCHAR(150),
    "email" VARCHAR(191),
    "phone" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "parentId" INTEGER,
    "categoryName" VARCHAR(200) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
 
CREATE TABLE "units_of_measures" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "uomCode" VARCHAR(20) NOT NULL,
    "uomName" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "units_of_measures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "categoryId" INTEGER,
    "uomId" INTEGER,
    "sku" VARCHAR(100) NOT NULL,
    "productName" VARCHAR(255) NOT NULL,
    "productType" "ProductType" NOT NULL DEFAULT 'physical',
    "costPrice" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_ledger" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchNo" VARCHAR(100),
    "quantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "costPrice" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_movements" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "referenceType" VARCHAR(60),
    "referenceId" INTEGER,
    "fromLocationId" INTEGER,
    "toLocationId" INTEGER,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "performedById" INTEGER NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_orders" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "poNumber" VARCHAR(50) NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "receivingLocationId" INTEGER NOT NULL,
    "orderDate" DATE NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'draft',
    "subtotal" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "purchase_order_items" (
    "id" SERIAL NOT NULL,
    "poId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "orderedQty" DECIMAL(15,4) NOT NULL,
    "receivedQty" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,4) NOT NULL,
    "lineTotal" DECIMAL(15,4) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "email" VARCHAR(191),
    "phone" VARCHAR(30),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "sales_orders" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "invoiceNo" VARCHAR(60) NOT NULL,
    "locationId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "cashierId" INTEGER NOT NULL,
    "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SaleStatus" NOT NULL DEFAULT 'confirmed',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "subtotal" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "sales_order_items" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "discount" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "lineTotal" DECIMAL(15,4) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "sales_returns" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "returnNo" VARCHAR(60) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnReason" VARCHAR(255),
    "totalRefunded" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "status" "ReturnStatus" NOT NULL DEFAULT 'pending',
    "processedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_returns_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "stock_transfers" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "transferNo" VARCHAR(60) NOT NULL,
    "fromLocationId" INTEGER NOT NULL,
    "toLocationId" INTEGER NOT NULL,
    "transferDate" DATE NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'draft',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "stock_transfer_items" (
    "id" SERIAL NOT NULL,
    "transferId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "requestedQty" DECIMAL(15,4) NOT NULL,
    "dispatchedQty" DECIMAL(15,4),
    "receivedQty" DECIMAL(15,4),

    CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

 
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER,
    "userId" INTEGER,
    "userType" "AuditUserType" NOT NULL DEFAULT 'member',
    "action" VARCHAR(80) NOT NULL,
    "entity" VARCHAR(80) NOT NULL,
    "entityId" INTEGER,
    "oldValues" JSONB,
    "newValues" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

 CreateIndex
CREATE UNIQUE INDEX "master_admin_email_key" ON "master_admin"("email");

 CreateIndex
CREATE UNIQUE INDEX "tenants_tenantCode_key" ON "tenants"("tenantCode");

 CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

 CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_roleName_key" ON "roles"("tenantId", "roleName");

 CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

 CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

 CreateIndex
CREATE UNIQUE INDEX "users_tenantId_username_key" ON "users"("tenantId", "username");

 CreateIndex
CREATE UNIQUE INDEX "user_sessions_tokenHash_key" ON "user_sessions"("tokenHash");

 CreateIndex
CREATE UNIQUE INDEX "locations_tenantId_locationCode_key" ON "locations"("tenantId", "locationCode");

 CreateIndex
CREATE UNIQUE INDEX "user_location_access_userId_locationId_key" ON "user_location_access"("userId", "locationId");

 CreateIndex
CREATE UNIQUE INDEX "units_of_measures_tenantId_uomCode_key" ON "units_of_measures"("tenantId", "uomCode");

 CreateIndex
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");

 CreateIndex
CREATE UNIQUE INDEX "stock_ledger_tenantId_locationId_productId_batchNo_key" ON "stock_ledger"("tenantId", "locationId", "productId", "batchNo");

 CreateIndex
CREATE UNIQUE INDEX "purchase_orders_tenantId_poNumber_key" ON "purchase_orders"("tenantId", "poNumber");

 CreateIndex
CREATE UNIQUE INDEX "sales_orders_tenantId_invoiceNo_key" ON "sales_orders"("tenantId", "invoiceNo");

 CreateIndex
CREATE UNIQUE INDEX "sales_returns_tenantId_returnNo_key" ON "sales_returns"("tenantId", "returnNo");

 CreateIndex
CREATE UNIQUE INDEX "stock_transfers_tenantId_transferNo_key" ON "stock_transfers"("tenantId", "transferNo");

 AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "master_admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "user_location_access" ADD CONSTRAINT "user_location_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "user_location_access" ADD CONSTRAINT "user_location_access_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "units_of_measures" ADD CONSTRAINT "units_of_measures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_uomId_fkey" FOREIGN KEY ("uomId") REFERENCES "units_of_measures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_ledger" ADD CONSTRAINT "stock_ledger_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_receivingLocationId_fkey" FOREIGN KEY ("receivingLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_poId_fkey" FOREIGN KEY ("poId") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_order_items" ADD CONSTRAINT "sales_order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "sales_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "sales_returns" ADD CONSTRAINT "sales_returns_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "stock_transfers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

 AddForeignKey
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
