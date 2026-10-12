import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth";
import { isConfigured } from "@/lib/env";
async function handle(request: Request) {
  if (!isConfigured())
    return Response.json(
      { error: "Staff sign-in is not configured." },
      { status: 503 },
    );
  const handlers = toNextJsHandler(getAuth());
  return request.method === "GET"
    ? handlers.GET(request)
    : handlers.POST(request);
}
export { handle as GET, handle as POST };
