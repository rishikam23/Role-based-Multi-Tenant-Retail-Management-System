import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userType: string
      tenantId?: string
      roleId?: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    userType: string
    tenantId?: string
    roleId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userType: string
    tenantId?: string
    roleId?: string
  }
}