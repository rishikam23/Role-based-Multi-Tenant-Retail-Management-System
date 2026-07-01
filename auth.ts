import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Sign in",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const username = credentials.username as string;
        const password = credentials.password as string;

        const masterAdmin = await prisma.masterAdmin.findFirst({
          where: {
            OR: [
              { username: username },
              { email: username }
            ]
          }
        });

        if (masterAdmin && masterAdmin.isActive) {
          const isValid = await bcrypt.compare(password, masterAdmin.passwordHash);
          if (isValid) {
            return {
              id: String(masterAdmin.id),
              email: masterAdmin.email,
              name: masterAdmin.fullName,
              userType: "master_admin",
            };
          }
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { username: username },
              { email: username }
            ]
          },
          include: { tenant: true }
        });

        if (user && user.isActive && (!user.tenant || user.tenant.isActive)) {
          const isValid = await bcrypt.compare(password, user.passwordHash);
          if (isValid) {
            return {
              id: String(user.id),
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              userType: user.userType,
              tenantId: user.tenantId ? String(user.tenantId) : undefined,
              roleId: user.roleId ? String(user.roleId) : undefined,
            };
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userType = user.userType;
        token.tenantId = user.tenantId;
        token.roleId = user.roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.userType = token.userType as string;
        session.user.tenantId = token.tenantId as string | undefined;
        session.user.roleId = token.roleId as string | undefined;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: { 
    strategy: "jwt",
    maxAge: 12 * 60 * 60,
  }
})