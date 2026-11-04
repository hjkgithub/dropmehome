
"use client";

export default function JourneyCard({ journey, onRequest }) {
  return (
    <article
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "15px",
        marginBottom: "15px",
      }}
    >
      <h3>{journey.name}</h3>

      <p>
        <strong>Destination:</strong> {journey.destination}
      </p>

      <p>
        <strong>Vehicle:</strong> {journey.vehicle}
      </p>

      <p>
        <strong>Available seats:</strong>{" "}
        {journey.seatsAvailable}
      </p>

      <small>
        Expires:{" "}
        {new Date(journey.expiresAt).toLocaleString()}
      </small>

      <button
        onClick={() => onRequest(journey)}
        disabled={Number(journey.seatsAvailable) <= 0}
        style={{
          display: "block",
          marginTop: "12px",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        Request Seats
      </button>
    </article>
  );
          }

