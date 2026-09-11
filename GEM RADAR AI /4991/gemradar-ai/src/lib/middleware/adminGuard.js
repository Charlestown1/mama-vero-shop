import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { errorResponse } from "@/lib/utils/apiResponse";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";

// Single reusable check for every admin API route: authenticate, require the
// admin role, and rate-limit — before any database operation runs. Routes do:
//
//   const auth = await requireAdminApi();
//   if (!auth.ok) return auth.response;
//   const { session } = auth;
//
// This is the only place "is this request allowed to touch admin data" is
// decided — no admin route should re-implement this check inline. Rate
// limiting here is deliberately generous (it's an internal tool, not a
// public endpoint) — its purpose is to blunt a compromised/scripted admin
// session, not to throttle normal admin usage.
export async function requireAdminApi() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { ok: false, response: NextResponse.json(errorResponse("Authentication required"), { status: 401 }) };
  }
  if (session.user.role !== "admin") {
    return { ok: false, response: NextResponse.json(errorResponse("Admin access required"), { status: 403 }) };
  }

  const rl = checkRateLimit(`admin:${session.user.id}`);
  if (!rl.allowed) {
    return { ok: false, response: NextResponse.json(errorResponse("Too many admin requests. Please slow down."), { status: 429 }) };
  }

  return { ok: true, session };
}
