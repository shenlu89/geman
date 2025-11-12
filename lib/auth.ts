import { betterAuth, APIError } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db"; // your drizzle instance
import { account, session, user, verification } from "@/db/schema";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: drizzleAdapter(
    db,
    {
      schema: {
        account, session, user, verification
      },
      provider: "sqlite",
    }
  ),
  user: {
    deleteUser: {
      enabled: true,
      // Optional: beforeDelete, afterDelete callbacks
    }
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [
    // This plugin is essential for server actions to set cookies
    nextCookies(),
  ],
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const users = await db.select().from(user);
        if (users.length > 0) {
          throw new APIError("BAD_REQUEST", {
            message: "The account already exists. Please login.",
          });
        }
      }
    }),
  },
});

export const getServerSession = async () => {
  return auth.api.getSession({
    headers: await headers(),
  })
}
