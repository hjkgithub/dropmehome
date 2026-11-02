
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

export async function POST(request) {
  try {
    const body = await request.json();

    const journeyId = body.journeyId?.trim();
    const name = body.name?.trim();
    const phone = body.phone?.trim();
    const seatsRequested = Number(body.seatsRequested);

    // Validate request details
    if (
      !journeyId ||
      !name ||
      !phone ||
      !Number.isInteger(seatsRequested) ||
      seatsRequested < 1 ||
      name.length > 60 ||
      phone.length > 20
    ) {
      return NextResponse.json(
        { error: "Please enter valid request details" },
        { status: 400 }
      );
    }

    // Find the active journey
    const journeys = await getActiveJourneys();

    const journey = journeys.find(
      (item) => item.id === journeyId
    );

    if (!journey) {
      return NextResponse.json(
        { error: "This journey is no longer available" },
        { status: 404 }
      );
    }

    // Check available seats
    const availableSeats = Number(journey.seatsAvailable);

    if (
      !Number.isInteger(availableSeats) ||
      seatsRequested > availableSeats
    ) {
      return NextResponse.json(
        { error: "Not enough seats are available" },
        { status: 400 }
      );
    }

    // Store requests separately for each journey
    const redisKey = `requests:${journeyId}`;

    const storedRequests = await redisCommand([
      "GET",
      redisKey,
    ]);

    const requests = storedRequests
      ? JSON.parse(storedRequests)
      : [];

    // Count seats in pending requests
    const pendingSeats = requests
      .filter((item) => item.status === "Pending")
      .reduce(
        (total, item) =>
          total + Number(item.seatsRequested),
        0
      );

    if (seatsRequested > availableSeats - pendingSeats) {
      return NextResponse.json(
        {
          error:
            "These seats are already requested by other visitors. Please try fewer seats.",
        },
        { status: 400 }
      );
    }

    // Create new request
    const newRequest = {
      id: randomUUID(),
      journeyId,
      name,
      phone,
      seatsRequested,
      status: "Pending",
      createdAt: Date.now(),
    };

    requests.push(newRequest);

    // Save request for 24 hours
    await redisCommand([
      "SET",
      redisKey,
      JSON.stringify(requests),
      "EX",
      "86400",
    ]);

    return NextResponse.json(
      {
        message: "Seat request submitted successfully!",
        request: {
          id: newRequest.id,
          status: newRequest.status,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Seat request error:", error);

    return NextResponse.json(
      { error: "Unable to submit seat request" },
      { status: 503 }
    );
  }
}
