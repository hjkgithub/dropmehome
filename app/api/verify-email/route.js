
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is missing." },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const verificationKey =
      `email-verification:${tokenHash}`;

    // Get email associated with token
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

    // Find user in Redis
    const key = emailKey(email);

    const userData = await redis([
      "GET",
      key,
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
      key,
      JSON.stringify(user),
    ]);

    // Delete used verification token
    await redis([
      "DEL",
      verificationKey,
    ]);

    return NextResponse.json({
      success: true,
      message: "Your email has been verified successfully!",
    });

  } catch (error) {
    console.error("Verify email error:", error);

    return NextResponse.json(
      { error: "Unable to verify email." },
      { status: 500 }
    );
  }
}

