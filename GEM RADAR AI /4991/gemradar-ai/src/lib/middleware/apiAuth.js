import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/utils/apiResponse";

export function requireAuth(handler) {
  return async (req, ctx) => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    }
    return handler(req, ctx, session);
  };
}

export function requireAdmin(handler) {
  return async (req, ctx) => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(errorResponse("Authentication required"), { status: 401 });
    }
    if (session.user.role !== "admin") {
      return NextResponse.json(errorResponse("Admin access required"), { status: 403 });
    }
    return handler(req, ctx, session);
  };
}
