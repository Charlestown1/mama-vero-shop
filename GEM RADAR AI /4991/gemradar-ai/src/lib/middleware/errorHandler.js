import { NextResponse } from "next/server";
import logger from "@/lib/logger/logger";
import { errorResponse } from "@/lib/utils/apiResponse";

export function withErrorHandler(handler) {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      logger.error(`Unhandled API error: ${err.message}`, { stack: err.stack });
      return NextResponse.json(errorResponse("Internal server error"), { status: 500 });
    }
  };
}
