import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json(successResponse({ status: "ok", db: "connected" }));
  } catch (err) {
    return NextResponse.json(errorResponse("Database connection failed", err.message), { status: 500 });
  }
}
