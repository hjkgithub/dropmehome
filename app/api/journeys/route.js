
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

  return journeys.filter(
    (item) => item.expiresAt > Date.now()
  );
}

// GET: Results depend on the currently selected mode.
export async function GET(request) {
  try {
    const user = await getSession(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in first" },
        { status: 401 }
      );
    }

    const mode = request.nextUrl.searchParams.get("mode");

    if (!["driver", "passenger"].includes(mode)) {
      return NextResponse.json(
        { error: "Please select a valid mode" },
        { status: 400 }
      );
    }

    const journeys = await getActiveJourneys();

    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(journeys),
      "EX",
      "86400",
    ]);

    let visibleJourneys;

    if (mode === "driver") {
      // Rider mode: only show journeys owned by this account.
      visibleJourneys = journeys.filter(
        (journey) => journey.ownerEmail === user.email
      );
    } else {
      // Passenger mode: show other people's journeys only.
      visibleJourneys = journeys
        .filter((journey) => journey.ownerEmail !== user.email)
        .map(({ ownerEmail, ...journey }) => journey);
    }

    return NextResponse.json({
      journeys: visibleJourneys,
    });
  } catch (error) {
    console.error("GET journeys error:", error);

    return NextResponse.json(
      { error: "Unable to load journeys" },
      { status: 503 }
    );
  }
}

// POST: Any logged-in account can publish a journey.
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

    const fromLocation = String(body.fromLocation || "").trim();
    const destination = String(body.destination || "").trim();
    const phone = String(body.phone || "").trim();
    const vehicle = String(body.vehicle || "").trim();
    const seatsAvailable = Number(body.seatsAvailable);

    if (
      !fromLocation ||
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

    if (
      fromLocation.length > 120 ||
      destination.length > 120 ||
      phone.length > 20
    ) {
      return NextResponse.json(
        { error: "Input is too long" },
        { status: 400 }
      );
    }

    const journeys = await getActiveJourneys();

    const myJourneys = journeys.filter(
      (journey) => journey.ownerEmail === user.email
    );

    if (myJourneys.length >= 5) {
      return NextResponse.json(
        {
          error: "You can publish a maximum of 5 active journeys. Delete one to publish another.",
        },
        { status: 400 }
      );
    }

    const now = Date.now();

    const newJourney = {
      id: randomUUID(),
      name: user.name,
      ownerEmail: user.email,
      fromLocation,
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

// DELETE: An account can delete only its own journeys.
export async function DELETE(request) {
  try {
    const user = await getSession(request);

    if (!user) {
      return NextResponse.json(
        { error: "Please log in first" },
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

    const journeys = await getActiveJourneys();

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

    const updatedJourneys = journeys.filter(
      (item) => item.id !== journeyId
    );

    await redisCommand([
      "SET",
      "journeys",
      JSON.stringify(updatedJourneys),
      "EX",
      "86400",
    ]);

    await redisCommand([
      "DEL",
      `requests:${journeyId}`,
    ]);

    return NextResponse.json({
      message: "Journey deleted successfully",
    });
  } catch (error) {
    console.error("DELETE journey error:", error);

    return NextResponse.json(
      { error: "Unable to delete journey" },
      { status: 503 }
    );
  }
}

   
