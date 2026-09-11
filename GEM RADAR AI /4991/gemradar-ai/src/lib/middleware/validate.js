import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/utils/apiResponse";

export async function validateBody(req, schema) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: NextResponse.json(errorResponse("Validation failed", result.error.flatten()), { status: 400 })
    };
  }
  return { data: result.data };
}
