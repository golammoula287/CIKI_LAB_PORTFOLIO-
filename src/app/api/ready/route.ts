import { getDb } from "@/server/db";
import { isConfigured } from "@/lib/env";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (!isConfigured())
      return Response.json({ status: "not-configured" }, { status: 503 });
    await getDb().$queryRaw`SELECT 1`;
    return Response.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
