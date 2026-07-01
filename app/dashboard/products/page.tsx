import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateProductModal } from "./_components/create-product-modal";
import { EditProductModal } from "./_components/edit-product-modal";
import { DynamicCurrencyDisplay } from "./_components/dynamic-currency";
import { deleteProduct } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function ProductsPage() {
  const session = await auth();

  if (!session?.user?.tenantId) {
    redirect("/dashboard");
  }

  const tenantId = parseInt(session.user.tenantId);
  const isMaster = session.user.userType === "master_admin";
  const isSuper = session.user.userType === "super_admin";

  let canEdit = isSuper || isMaster;
  if (!isMaster && session.user.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    if (perms.length > 0) {
      canEdit = false;
      if (perms.some(rp => rp.permission.module === "products" && rp.permission.action === "edit")) {
          canEdit = true;
      }
    }
  }

  const products = await prisma.product.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Products Catalog</h1>
        <p className="text-muted-foreground">
          Manage your inventory items and SKUs.
        </p>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 flex flex-row items-center justify-between border-b">
          <div>
            <h3 className="text-lg font-semibold">Live Catalog</h3>
          </div>
          {canEdit && <CreateProductModal />}
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
              {canEdit && <TableHead className="text-right w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No products in catalog yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell className="font-medium">{prod.sku}</TableCell>
                  <TableCell>{prod.productName}</TableCell>
                  <TableCell className="capitalize">{prod.productType}</TableCell>
                  <TableCell className="text-right">
                    <DynamicCurrencyDisplay amount={Number(prod.sellingPrice) || 0} />
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditProductModal product={{...prod, costPrice: Number(prod.costPrice), sellingPrice: Number(prod.sellingPrice)}} />
                        <form action={async () => {
                          "use server";
                          await deleteProduct(prod.id);
                        }}>
                          <Button variant="destructive" size="sm" type="submit">
                            Remove
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}