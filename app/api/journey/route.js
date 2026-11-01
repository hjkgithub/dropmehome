
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Storage is not configured");
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
    throw new Error("Storage request failed");
  }

  const data = await response.json();
  return data.result;
}

async function getActiveJourneys() {
  const stored = await redisCommand(["GET", "journeys"]);
  const journeys = stored ? JSON.parse(stored) : [];

  return journeys.filter(
    (item) => item.expiresAt > Date.now()
  );
}

export async function GET() {
  try {
    const journeys = await getActiveJourneys();

    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(journeys),
      "EX",
      "86400",
    ]);

    return NextResponse.json(journeys);
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 503 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const destination = body.destination?.trim();
    const phone = body.phone?.trim();

    if (!name || !destination || !phone) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (
      name.length > 60 ||
      destination.length > 120 ||
      phone.length > 20
    ) {
      return NextResponse.json(
        { error: "Input is too long" },
        { status: 400 }
      );
    }

    const journeys = await getActiveJourneys();

    const newJourney = {
      id: randomUUID(),
      name,
      destination,
      phone,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    };

    journeys.unshift(newJourney);

    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(journeys),
      "EX",
      "86400",
    ]);

    return NextResponse.json(
      { message: "Journey shared successfully!" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 503 }
    );
  }
      }

