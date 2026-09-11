import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import connectDB from "@/lib/db/connectDB";
import ResearchReport from "@/models/ResearchReport";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const report = await ResearchReport.findOne({ _id: params.id, user: session.user.id });
    if (!report) return NextResponse.json(errorResponse("Report not found"), { status: 404 });

    return NextResponse.json(successResponse({ report }));
  } catch (err) {
    logger.error(`Fetch report error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to load report"), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json(errorResponse("Authentication required"), { status: 401 });

    await connectDB();
    const report = await ResearchReport.findOneAndDelete({ _id: params.id, user: session.user.id });
    if (!report) return NextResponse.json(errorResponse("Report not found"), { status: 404 });

    return NextResponse.json(successResponse({ deleted: true }));
  } catch (err) {
    logger.error(`Delete report error: ${err.message}`);
    return NextResponse.json(errorResponse("Failed to delete report"), { status: 500 });
  }
}
