import { NextResponse } from "next/server";
import {
  randomBytes,
  createHash,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 3 * 60 * 60;

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Redis is not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Redis request failed");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data.result;
}

// Generate a private Redis key for each email
function emailKey(email) {
  const hash = createHash("sha256")
    .update(email)
    .digest("hex");

  return `user:${hash}`;
}

// Secure password hashing
async function hashPassword(password, salt) {
  const result = await scrypt(password, salt, 64);
  return result.toString("hex");
}

// Never expose password or salt
function safeUser(user) {
  return {
    name: user.name,
    email: user.email,
    role: user.role || "",
  };
}

// Create a 3-hour session
async function createSession(user) {
  const token = randomBytes(32).toString("hex");

  await redisCommand([
    "SET",
    `session:${token}`,
    JSON.stringify(safeUser(user)),
    "EX",
    String(SESSION_SECONDS),
  ]);

  return token;
}

// Set secure session cookie
function setSessionCookie(response, token) {
  response.cookies.set("journey_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

// REGISTER AND LOGIN
export async function POST(request) {
  try {
    const body = await request.json();

    const action = body.action;

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json(
        { error: "Password must be 8 to 128 characters" },
        { status: 400 }
      );
    }

    const key = emailKey(email);

    // CREATE ACCOUNT
    if (action === "register") {
      const name = String(body.name || "").trim();
      const role = body.role;

      if (!name || name.length > 60) {
        return NextResponse.json(
          { error: "Enter your name (maximum 60 characters)" },
          { status: 400 }
        );
      }

      if (!["passenger", "driver"].includes(role)) {
        return NextResponse.json(
          { error: "Please select your account type" },
          { status: 400 }
        );
      }

      const salt = randomBytes(16).toString("hex");

      const passwordHash = await hashPassword(
        password,
        salt
      );

      const user = {
        name,
        email,
        role,
        salt,
        passwordHash,
        createdAt: Date.now(),
      };

      // NX prevents duplicate email registration
      const result = await redisCommand([
        "SET",
        key,
        JSON.stringify(user),
        "NX",
      ]);

      if (result !== "OK") {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const token = await createSession(user);

      const response = NextResponse.json({
        message: "Account created successfully",
        user: safeUser(user),
      });

      setSessionCookie(response, token);

      return response;
    }

    // LOGIN
    if (action === "login") {
      const stored = await redisCommand([
        "GET",
        key,
      ]);

      if (!stored) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const user = JSON.parse(stored);

      const passwordHash = await hashPassword(
        password,
        user.salt
      );

      const submitted = Buffer.from(
        passwordHash,
        "hex"
      );

      const saved = Buffer.from(
        user.passwordHash,
        "hex"
      );

      if (
        submitted.length !== saved.length ||
        !timingSafeEqual(submitted, saved)
      ) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = await createSession(user);

      const response = NextResponse.json({
        message: "Login successful",
        user: safeUser(user),
      });

      setSessionCookie(response, token);

      return response;
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Authentication error:", error);

    return NextResponse.json(
      { error: "Authentication service is unavailable" },
      { status: 503 }
    );
  }
}

// CHECK LOGIN SESSION
export async function GET(request) {
  try {
    const token = request.cookies.get(
      "journey_session"
    )?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const stored = await redisCommand([
      "GET",
      `session:${token}`,
    ]);

    if (!stored) {
      const response = NextResponse.json({
        user: null,
      });

      response.cookies.delete("journey_session");

      return response;
    }

    return NextResponse.json({
      user: JSON.parse(stored),
    });

  } catch (error) {
    console.error("Session check error:", error);

    return NextResponse.json(
      { error: "Unable to check session" },
      { status: 503 }
    );
  }
}

// LOGOUT
export async function DELETE(request) {
  try {
    const token = request.cookies.get(
      "journey_session"
    )?.value;

    if (token) {
      await redisCommand([
        "DEL",
        `session:${token}`,
      ]);
    }

    const response = NextResponse.json({
      message: "Logged out successfully",
    });

    response.cookies.delete("journey_session");

    return response;

  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Unable to log out" },
      { status: 503 }
    );
  }
    }
