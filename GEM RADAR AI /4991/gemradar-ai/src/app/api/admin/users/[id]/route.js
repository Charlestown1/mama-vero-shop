import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { requireAdminApi } from "@/lib/middleware/adminGuard";
import { getUserDetail, setUserSuspended, setUserRole, setUserSubscription } from "@/services/admin/userAdminService";
import { logAdminAction } from "@/services/admin/adminLogService";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const detail = await getUserDetail(params.id);
    return NextResponse.json(successResponse(detail));
  } catch (err) {
    logger.error(`Admin get user error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 404 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;

  try {
    await connectDB();
    const body = await req.json();
    let user;

    if (body.isSuspended !== undefined) {
      user = await setUserSuspended(params.id, body.isSuspended);
      await logAdminAction(auth.session.user.id, body.isSuspended ? "user.suspend" : "user.unsuspend", { targetType: "User", targetId: params.id });
    } else if (body.role) {
      user = await setUserRole(params.id, body.role);
      await logAdminAction(auth.session.user.id, "user.role_change", { targetType: "User", targetId: params.id, details: { newRole: body.role } });
    } else if (body.subscriptionTier || body.subscriptionStatus) {
      user = await setUserSubscription(params.id, { tier: body.subscriptionTier, status: body.subscriptionStatus });
      await logAdminAction(auth.session.user.id, "user.subscription_override", { targetType: "User", targetId: params.id, details: { tier: body.subscriptionTier, status: body.subscriptionStatus } });
    } else {
      return NextResponse.json(errorResponse("No valid fields to update"), { status: 400 });
    }

    return NextResponse.json(successResponse({ user }));
  } catch (err) {
    logger.error(`Admin update user error: ${err.message}`);
    return NextResponse.json(errorResponse(err.message), { status: 400 });
  }
}
