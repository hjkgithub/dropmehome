
"use client";

import PassengerLiveLocation from "./PassengerLiveLocation";

export default function JourneyCard({
  journey,
  onRequest,
  canViewLiveLocation = false,
}) {
  return (
    <article
      style={{
        border: "1px solid #ddd",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "16px",
        background: "#fff",
        color: "#222",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        {journey.name}
      </h3>

      <div
        style={{
          background: "#f3f7ff",
          padding: "14px",
          borderRadius: "8px",
          marginBottom: "14px",
        }}
      >
        <small style={{ color: "#555" }}>
          JOURNEY ROUTE
        </small>

        <h3
          style={{
            margin: "8px 0",
            fontSize: "18px",
            lineHeight: "1.5",
            color: "#174ea6",
          }}
        >
          Rider is now in{" "}
          {journey.fromLocation || "Unknown location"}
          {" and going to "}
          {journey.destination}
        </h3>

        <p
  style={{
    fontSize: "12px",
    color: "#777",
    marginTop: "6px",
  }}
>
  Posted at:{" "}
  {journey.createdAt &&
  Number.isFinite(Number(journey.createdAt)) &&
  Number(journey.createdAt) > 0
    ? new Date(Number(journey.createdAt)).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "Time unavailable"}
</p>
      </div>

      <p>
        <strong>Vehicle:</strong> {journey.vehicle}
      </p>

      <p>
        <strong>Available seats:</strong> {journey.seatsAvailable}
      </p>

      <p>
        <strong>Expires:</strong>{" "}
        {new Date(journey.expiresAt).toLocaleString()}
      </p>

      {canViewLiveLocation && (
        <PassengerLiveLocation journeyId={journey.id} />
      )}

      <button
        onClick={() => onRequest(journey)}
        disabled={Number(journey.seatsAvailable) <= 0}
        style={{
          display: "block",
          width: "100%",
          marginTop: "14px",
          padding: "12px",
          background:
            Number(journey.seatsAvailable) <= 0
              ? "#999"
              : "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor:
            Number(journey.seatsAvailable) <= 0
              ? "not-allowed"
              : "pointer",
        }}
      >
        {Number(journey.seatsAvailable) <= 0
          ? "No Seats Available"
          : "Request Seats"}
      </button>
    </article>
  );
}
