
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return NextResponse.json(
        { error: "Redis configuration missing." },
        { status: 500 }
      );
    }

    const response = await fetch(
      `${url}/incr/journey_share_visitors`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Redis error");
    }

    return NextResponse.json({
      visitors: Number(data.result),
    });
  } catch (error) {
    console.error("Visitor counter error:", error);

    return NextResponse.json(
      { error: "Could not update visitor count." },
      { status: 500 }
    );
  }
}

