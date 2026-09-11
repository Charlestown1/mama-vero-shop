import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connectDB";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth/password";
import { checkRateLimit } from "@/lib/middleware/rateLimiter";
import { successResponse, errorResponse } from "@/lib/utils/apiResponse";
import logger from "@/lib/logger/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(req) {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export async function POST(req) {
  try {
    // No account exists yet at this point, so rate-limit by IP rather than
    // user ID — this is what actually protects signup from being scripted.
    const rl = checkRateLimit(`signup:${getClientIp(req)}`);
    if (!rl.allowed) {
      return NextResponse.json(errorResponse("Too many signup attempts. Please try again later."), { status: 429 });
    }

    const body = await req.json();
    const { name, username, email, password, confirmPassword } = body;

    if (!name || !username || !email || !password || !confirmPassword) {
      return NextResponse.json(errorResponse("All fields are required"), { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(errorResponse("Enter a valid email address"), { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json(errorResponse("Passwords do not match"), { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(errorResponse("Password must be at least 8 characters"), { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return NextResponse.json(errorResponse("Email or username already in use"), { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name, username, email, password: hashedPassword,
      authProvider: "credentials", role: "user", subscriptionTier: "free"
    });

    logger.info(`New user registered: ${user.email}`);
    return NextResponse.json(successResponse({ id: user._id, email: user.email, username: user.username }));
  } catch (err) {
    logger.error(`Signup error: ${err.message}`);
    return NextResponse.json(errorResponse("Signup failed", err.message), { status: 500 });
  }
}
