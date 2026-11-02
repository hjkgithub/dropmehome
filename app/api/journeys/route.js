
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

  if (data.error) {
    throw new Error(data.error);
  }

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
    console.error("GET journeys error:", error);

    return NextResponse.json(
      { error: "Unable to load journeys" },
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
    const vehicle = body.vehicle?.trim();
    const seatsAvailable = Number(body.seatsAvailable);

    // Validate required fields
    if (
      !name ||
      !destination ||
      !phone ||
      !vehicle ||
      !Number.isInteger(seatsAvailable) ||
      seatsAvailable < 1 ||
      seatsAvailable > 10
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter all details and valid passenger seats (1-10)",
        },
        { status: 400 }
      );
    }

    // Validate vehicle
    if (!["Bike", "Car"].includes(vehicle)) {
      return NextResponse.json(
        { error: "Select Bike or Car" },
        { status: 400 }
      );
    }

    // Validate text lengths
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

    // Get existing active journeys
    const journeys = await getActiveJourneys();

    const now = Date.now();

    // Create new journey
    const newJourney = {
      id: randomUUID(),
      name,
      destination,
      phone,
      vehicle,
      seatsAvailable,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
    };

    journeys.unshift(newJourney);

    // Save to Upstash Redis
    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(journeys),
      "EX",
      "86400",
    ]);

    return NextResponse.json(
      {
        message: "Journey shared successfully!",
        journey: newJourney,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("POST journeys error:", error);

    return NextResponse.json(
      { error: "Unable to save journey" },
      { status: 503 }
    );
  }
}
