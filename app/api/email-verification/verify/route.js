
import { NextResponse } from "next/server";
import { createHash } from "crypto";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "Redis request failed");
  }

  return data.result;
}

function emailKey(email) {
  const hash = createHash("sha256")
    .update(email)
    .digest("hex");

  return `user:${hash}`;
}

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const verificationKey = `email-verification:${tokenHash}`;

    // Find the email associated with this token
    const email = await redis([
      "GET",
      verificationKey,
    ]);

    if (!email) {
      return NextResponse.json(
        { error: "Invalid or expired verification link." },
        { status: 400 }
      );
    }

    // Find the user
    const userData = await redis([
      "GET",
      emailKey(email),
    ]);

    if (!userData) {
      return NextResponse.json(
        { error: "User account not found." },
        { status: 404 }
      );
    }

    const user = JSON.parse(userData);

    // Mark email as verified
    user.emailVerified = true;

    await redis([
      "SET",
      emailKey(email),
      JSON.stringify(user),
    ]);

    // Delete token after successful verification
    await redis([
      "DEL",
      verificationKey,
    ]);

    return NextResponse.json({
      success: true,
      message: "Your email has been verified successfully!",
    });

  } catch (error) {
    console.error("Email verification error:", error);

    return NextResponse.json(
      { error: "Unable to verify email. Please try again." },
      { status: 500 }
    );
  }
}

