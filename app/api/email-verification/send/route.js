
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { sendVerificationEmail } from "../../../lib/mailer";



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
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userData = await redis([
      "GET",
      emailKey(normalizedEmail),
    ]);

    if (!userData) {
      return NextResponse.json(
        { message: "If the account exists, a verification email will be sent." }
      );
    }

    const user = JSON.parse(userData);

    if (user.emailVerified === true) {
      return NextResponse.json({
        message: "Email is already verified.",
      });
    }

    const token = randomBytes(32).toString("hex");

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    await redis([
      "SET",
      `email-verification:${tokenHash}`,
      normalizedEmail,
      "EX",
      "3600",
    ]);

    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      message: "Verification email sent successfully.",
    });
  } catch (error) {
    console.error("Verification email error:", error);

    return NextResponse.json(
      { error: "Unable to send verification email." },
      { status: 500 }
    );
  }
}

