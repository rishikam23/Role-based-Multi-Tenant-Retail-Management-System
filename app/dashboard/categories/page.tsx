import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { CreateCategoryModal } from "./_components/create-category-modal";
import { EditCategoryModal } from "./_components/edit-category-modal";
import { deleteCategory } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function CategoriesPage() {
  const session = await auth();
  const tenantId = session?.user?.tenantId ? parseInt(session.user.tenantId) : null;
  const isSuper = session?.user?.userType === "super_admin";
  const isMaster = session?.user?.userType === "master_admin";

  if (!tenantId) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">You must belong to an organization to view categories.</p>
      </div>
    );
  }

  let canEdit = isSuper || isMaster;
  
  if (!canEdit && session?.user?.roleId) {
    const perms = await prisma.rolePermission.findMany({
      where: { roleId: Number(session.user.roleId) },
      include: { permission: true }
    });
    if (perms.some(rp => rp.permission.module === "categories" && rp.permission.action === "edit")) {
        canEdit = true;
    }
  }

  const categories = await prisma.category.findMany({
    where: { tenantId },
    include: { parent: true },
    orderBy: { createdAt: 'asc' }
  });

  const categoryOptions = categories.map(c => ({ id: c.id, categoryName: c.categoryName }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-muted-foreground">Manage hierarchical classification for inventory items.</p>
        </div>
        {canEdit && <CreateCategoryModal existingCategories={categoryOptions} />}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Status</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 4 : 3} className="text-center py-8 text-muted-foreground">
                  No categories registered yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.categoryName}</TableCell>
                  <TableCell>{cat.parent ? cat.parent.categoryName : <span className="text-muted-foreground italic">None (Top Level)</span>}</TableCell>
                  <TableCell>
                    {cat.isActive ? (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600 border border-green-200">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200">Inactive</span>
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditCategoryModal category={cat} existingCategories={categoryOptions} />
                        <form action={async () => {
                          "use server";
                          await deleteCategory(cat.id);
                        }}>
                          <Button variant="destructive" size="sm" type="submit">Delete</Button>
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
