
import { NextResponse } from "next/server";

async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("Redis is not configured");

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Redis request failed");

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

async function getJourney(journeyId) {
  const stored = await redisCommand(["GET", "journeys"]);
  const journeys = stored ? JSON.parse(stored) : [];

  return journeys.find(
    (journey) =>
      journey.id === journeyId &&
      journey.expiresAt > Date.now()
  );
}

// Driver updates or stops live location
export async function POST(request) {
  try {
    const user = await getSession(request);

    if (!user || user.role !== "driver") {
      return NextResponse.json(
        { error: "Driver login required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const journeyId = String(body.journeyId || "");

    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }

    const journey = await getJourney(journeyId);

    if (!journey || journey.ownerEmail !== user.email) {
      return NextResponse.json(
        { error: "Journey not found or access denied" },
        { status: 404 }
      );
    }

    const redisKey = `live_location:${journeyId}`;

    if (body.action === "stop") {
      await redisCommand(["DEL", redisKey]);

      return NextResponse.json({
        message: "Live location sharing stopped",
      });
    }

    const latitude = body.latitude;
    const longitude = body.longitude;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: "Invalid GPS coordinates" },
        { status: 400 }
      );
    }

    const location = {
      latitude,
      longitude,
      updatedAt: Date.now(),
    };

    await redisCommand([
      "SET",
      redisKey,
      JSON.stringify(location),
      "EX",
      "7200",
    ]);

    return NextResponse.json({
      message: "Location updated",
    });
  } catch (error) {
    console.error("Live location POST error:", error);

    return NextResponse.json(
      { error: "Unable to update live location" },
      { status: 503 }
    );
  }
}

// Passenger retrieves location for a journey
export async function GET(request) {
  try {
    const user = await getSession(request);

    if (!user || user.role !== "passenger") {
      return NextResponse.json(
        { error: "Passenger login required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const journeyId = searchParams.get("journeyId");

    if (!journeyId) {
      return NextResponse.json(
        { error: "Journey ID is required" },
        { status: 400 }
      );
    }

    const journey = await getJourney(journeyId);

    if (!journey) {
      return NextResponse.json(
        { error: "Journey not found or expired" },
        { status: 404 }
      );
    }

    // Check whether this passenger requested a seat
    const requestsStored = await redisCommand([
      "GET",
      `requests:${journeyId}`,
    ]);

    const requests = requestsStored
      ? JSON.parse(requestsStored)
      : [];

    const hasRequested = requests.some((item) => {
      const status = String(item.status || "").toLowerCase();

      return (
        item.email === user.email &&
        (status === "pending" || status === "accepted")
      );
    });

    if (!hasRequested) {
      return NextResponse.json(
        { error: "You must request a seat to view this location." },
        { status: 403 }
      );
    }

    const stored = await redisCommand([
      "GET",
      `live_location:${journeyId}`,
    ]);

    const location = stored ? JSON.parse(stored) : null;

const isFresh =
  location &&
  Date.now() - location.updatedAt <= 30000;

return NextResponse.json({
  location: isFresh ? location : null,
});

    
  } catch (error) {
    console.error("Live location GET error:", error);

    return NextResponse.json(
      { error: "Unable to retrieve live location" },
      { status: 503 }
    );
  }
}
