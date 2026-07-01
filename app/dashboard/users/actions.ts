"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function managePermissions(userId: number, permissions: { [key: string]: boolean }) {
  const session = await auth();

  if (!session?.user?.tenantId && session?.user?.userType !== "master_admin") {
    return { error: "Unauthorized" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  if (!targetUser) return { error: "User not found" };

  if (session.user.userType !== "master_admin" && targetUser.tenantId !== parseInt(session.user.tenantId || "0")) {
    return { error: "Unauthorized access to tenant user" };
  }

  try {
    let roleId = targetUser.roleId;

    if (!roleId) {
      const role = await prisma.role.create({
        data: {
          roleName: `user_${userId}_custom_role`,
          tenantId: targetUser.tenantId as number,
        }
      });
      roleId = role.id;

      await prisma.user.update({
        where: { id: userId },
        data: { roleId }
      });
    }

    await prisma.rolePermission.deleteMany({
      where: { roleId }
    });

    for (const [permKey, isActive] of Object.entries(permissions)) {
      if (isActive) {
        const [module, action] = permKey.split(":");

        let dbPerm = await prisma.permission.findFirst({
          where: { module: module.toLowerCase(), action: action.toLowerCase() }
        });

        if (!dbPerm) {
          dbPerm = await prisma.permission.create({
            data: { module: module.toLowerCase(), action: action.toLowerCase(), displayName: `${action} ${module}` }
          });
        }

        await prisma.rolePermission.create({
          data: {
            roleId,
            permissionId: dbPerm.id
          }
        });
      }
    }

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: "Security mapping failed." };
  }
}

import bcrypt from "bcryptjs";

export async function createMember(formData: FormData) {
  const session = await auth();
  const tenantId = session?.user?.tenantId;
  const userType = session?.user?.userType;

  if (!tenantId || userType !== "super_admin") {
    return { error: "Only organizational Super Admins can deploy new members." };
  }

  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const roleName = formData.get("roleName")?.toString() || "Staff Member";

  if (!firstName || !lastName || !email || !password) {
    return { error: "All account fields are required." };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const parsedTenantId = parseInt(tenantId);
    const initialRole = await prisma.role.create({
      data: {
        roleName,
        tenantId: parsedTenantId
      }
    });

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        username: email,
        passwordHash: hashedPassword,
        tenantId: parsedTenantId,
        userType: "member",
        roleId: initialRole.id
      }
    });

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "An account with this email already exists." };
    }
    return { error: "Failed to allocate member workspace." };
  }
}

export async function updateMember(userId: number, formData: FormData) {
  const session = await auth();
  
  if (!session?.user?.tenantId && session?.user?.userType !== "master_admin") {
    return { error: "Unauthorized" };
  }

  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();
  const email = formData.get("email")?.toString();
  const roleName = formData.get("roleName")?.toString();

  if (!firstName || !lastName || !email || !roleName) {
    return { error: "Missing fields" };
  }

  try {
    const mem = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!mem) return { error: "User not found" };

    if (session.user.userType !== "master_admin" && mem.tenantId !== parseInt(session.user.tenantId || "0")) {
      return { error: "Unauthorized access to tenant user" };
    }

    if (mem.id.toString() === session.user?.id) {
      return { error: "Self-modification restricted" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, email, username: email }
    });

    if (mem.roleId) {
      await prisma.role.update({
        where: { id: mem.roleId },
        data: { roleName }
      });
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { error: "Update logic failed" };
  }
}

export async function deleteMember(userId: number) {
  const session = await auth();
  if (!session?.user?.tenantId && session?.user?.userType !== "master_admin") {
    throw new Error("Unauthorized");
  }

  try {
    const mem = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!mem) throw new Error("Access Denied");
    
    if (session.user.userType !== "master_admin" && mem.tenantId !== parseInt(session.user.tenantId || "0")) {
      throw new Error("Cross-tenant destruction restricted");
    }

    if (mem.id.toString() === session.user.id) {
      throw new Error("Self-sabotage restricted");
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    if (mem.roleId) {
      await prisma.role.delete({ where: { id: mem.roleId } });
    }

    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard");
  } catch (err) {
    console.error(err);
  }
}