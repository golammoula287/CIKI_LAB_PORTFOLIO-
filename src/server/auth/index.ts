import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/server/db";
import { getEnv, isConfigured } from "@/lib/env";
function createAuth() {
  if (!isConfigured())
    throw new Error("Staff authentication has not been configured.");
  const env = getEnv();
  return betterAuth({
    database: prismaAdapter(getDb(), { provider: "postgresql" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      minPasswordLength: 12,
    },
    rateLimit: { enabled: true, storage: "database" },
    session: { cookieCache: { enabled: false } },
    plugins: [nextCookies()],
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  instance ??= createAuth();
  return instance;
}
export async function getStaff() {
  if (!isConfigured()) return null;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return null;
  const user = await getDb().user.findUnique({
    where: { id: session.user.id },
  });
  if (!user?.active) return null;
  return user;
}
export async function requireStaff() {
  const user = await getStaff();
  if (!user) redirect("/login");
  return user;
}
