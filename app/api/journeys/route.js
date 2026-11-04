
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

  if (!response.ok) throw new Error("Storage request failed");

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data.result;
}

async function getSession(request) {
  const token = request.cookies.get("journey_session")?.value;
  if (!token) return null;

  const stored = await redisCommand(["GET", `session:${token}`]);
  return stored ? JSON.parse(stored) : null;
}

async function getActiveJourneys() {
  const stored = await redisCommand(["GET", "journeys"]);
  const journeys = stored ? JSON.parse(stored) : [];

  return journeys.filter((item) => item.expiresAt > Date.now());
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

    // Do not expose the driver's account email publicly.
    const publicJourneys = journeys.map(
      ({ ownerEmail, ...journey }) => journey
    );

    return NextResponse.json({
      journeys:publicJourneys
    });
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
    const user = await getSession(request);

    if (!user || user.role !== "driver") {
      return NextResponse.json(
        { error: "Only logged-in drivers can publish journeys" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const destination = body.destination?.trim();
    const phone = body.phone?.trim();
    const vehicle = body.vehicle?.trim();
    const seatsAvailable = Number(body.seatsAvailable);

    if (
      !destination ||
      !phone ||
      !vehicle ||
      !Number.isInteger(seatsAvailable) ||
      seatsAvailable < 1 ||
      seatsAvailable > 10
    ) {
      return NextResponse.json(
        { error: "Please enter all details and valid seats (1-10)" },
        { status: 400 }
      );
    }

    if (!["Bike", "Car"].includes(vehicle)) {
      return NextResponse.json(
        { error: "Select Bike or Car" },
        { status: 400 }
      );
    }

    if (destination.length > 120 || phone.length > 20) {
      return NextResponse.json(
        { error: "Input is too long" },
        { status: 400 }
      );
    }

    const journeys = await getActiveJourneys();
    const now = Date.now();

    const newJourney = {
      id: randomUUID(),
      name: user.name,
      ownerEmail: user.email,
      destination,
      phone,
      vehicle,
      seatsAvailable,
      createdAt: now,
      expiresAt: now + 2 * 60 * 60 * 1000,
    };

    journeys.unshift(newJourney);

    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(journeys),
      "EX",
      "86400",
    ]);

    const { ownerEmail, ...publicJourney } = newJourney;

    return NextResponse.json(
      {
        message: "Journey shared successfully!",
        journey: publicJourney,
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
