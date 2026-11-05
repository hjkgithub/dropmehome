
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

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

async function getJourneys() {
  const stored = await redisCommand(["GET", "journeys"]);
  const journeys = stored ? JSON.parse(stored) : [];

  return journeys.filter((item) => item.expiresAt > Date.now());
}

async function getRequests(journeyId) {
  const stored = await redisCommand([
    "GET",
    `requests:${journeyId}`,
  ]);

  return stored ? JSON.parse(stored) : [];
}

// Driver: see requests for their own journeys
export async function GET(request) {
  try {
    const user = await getSession(request);

    if (!user || user.role !== "driver") {
      return NextResponse.json(
        { error: "Driver login required" },
        { status: 401 }
      );
    }

    const journeys = await getJourneys();

    const ownJourneys = journeys.filter(
      (journey) => journey.ownerEmail === user.email
    );

    const results = [];

    for (const journey of ownJourneys) {
      const requests = await getRequests(journey.id);

      for (const item of requests) {
        results.push({
          ...item,
          journey: {
            id: journey.id,
            destination: journey.destination,
            vehicle: journey.vehicle,
          },
        });
      }
    }

    results.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({
      requests: results,
    });
  } catch (error) {
    console.error("GET requests error:", error);

    return NextResponse.json(
      { error: "Unable to load passenger requests" },
      { status: 503 }
    );
  }
}

// Passenger: submit a seat request
// Driver: accept or reject a request
export async function POST(request) {
  try {
    const user = await getSession(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Driver accepts or rejects a request
    if (body.action === "accept" || body.action === "reject") {
      if (user.role !== "driver") {
        return NextResponse.json(
          { error: "Driver login required" },
          { status: 403 }
        );
      }

      const journeyId = String(body.journeyId || "");
      const requestId = String(body.requestId || "");

      const journeys = await getJourneys();

      const journey = journeys.find(
        (item) =>
          item.id === journeyId &&
          item.ownerEmail === user.email
      );

      if (!journey) {
        return NextResponse.json(
          { error: "Journey not found or access denied" },
          { status: 404 }
        );
      }

      const redisKey = `requests:${journeyId}`;
      const requests = await getRequests(journeyId);

      const target = requests.find(
        (item) => item.id === requestId
      );

      if (!target) {
        return NextResponse.json(
          { error: "Request not found" },
          { status: 404 }
        );
      }

      if (target.status !== "Pending") {
        return NextResponse.json(
          { error: "This request has already been processed" },
          { status: 409 }
        );
      }

      if (body.action === "accept") {
        const acceptedSeats = requests
          .filter((item) => item.status === "Accepted")
          .reduce(
            (total, item) => total + Number(item.seatsRequested),
            0
          );

        if (
          acceptedSeats + Number(target.seatsRequested) >
          Number(journey.seatsAvailable)
        ) {
          return NextResponse.json(
            { error: "Not enough seats remain" },
            { status: 409 }
          );
        }
      }

      target.status =
        body.action === "accept" ? "Accepted" : "Rejected";

      target.updatedAt = Date.now();

      await redisCommand([
        "SET",
        redisKey,
        JSON.stringify(requests),
        "EX",
        "86400",
      ]);

      return NextResponse.json({
        message: `Request ${target.status.toLowerCase()} successfully`,
        request: {
          id: target.id,
          status: target.status,
        },
      });
    }

    // Passenger submits a new request
    if (user.role !== "passenger") {
      return NextResponse.json(
        { error: "Passenger login required" },
        { status: 403 }
      );
    }

    const journeyId = String(body.journeyId || "").trim();
    const phone = String(body.phone || "").trim();
    const seatsRequested = Number(body.seatsRequested);

    if (
      !journeyId ||
      !phone ||
      phone.length > 20 ||
      !Number.isInteger(seatsRequested) ||
      seatsRequested < 1 ||
      seatsRequested > 10
    ) {
      return NextResponse.json(
        { error: "Please enter valid request details" },
        { status: 400 }
      );
    }

    const journeys = await getJourneys();

    const journey = journeys.find(
      (item) => item.id === journeyId
    );

    if (!journey) {
      return NextResponse.json(
        { error: "This journey is no longer available" },
        { status: 404 }
      );
    }

    const redisKey = `requests:${journeyId}`;
    const requests = await getRequests(journeyId);

    const pendingSeats = requests
      .filter((item) => item.status === "Pending")
      .reduce(
        (total, item) => total + Number(item.seatsRequested),
        0
      );

    const acceptedSeats = requests
      .filter((item) => item.status === "Accepted")
      .reduce(
        (total, item) => total + Number(item.seatsRequested),
        0
      );

    if (
      seatsRequested >
      Number(journey.seatsAvailable) - pendingSeats - acceptedSeats
    ) {
      return NextResponse.json(
        { error: "Not enough seats are available" },
        { status: 400 }
      );
    }

     
const passengerLocation = body.passengerLocation;

const validLocation =
  passengerLocation &&
  Number.isFinite(passengerLocation.latitude) &&
  Number.isFinite(passengerLocation.longitude) &&
  passengerLocation.latitude >= -90 &&
  passengerLocation.latitude <= 90 &&
  passengerLocation.longitude >= -180 &&
  passengerLocation.longitude <= 180
    ? {
        latitude: passengerLocation.latitude,
        longitude: passengerLocation.longitude,
      }
    : null;

const newRequest = {
  id: randomUUID(),
  journeyId,
  name: user.name,
  email: user.email,
  phone,
  seatsRequested,
  passengerLocation: validLocation,
  status: "Pending",
  createdAt: Date.now(),
};
    

    

    requests.push(newRequest);

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
      { error: "Unable to process seat request" },
      { status: 503 }
    );
  }
}
