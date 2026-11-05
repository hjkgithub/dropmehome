
"use client";

export default function JourneyCard({ journey, onRequest }) {
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

<p>DEBUG: {JSON.stringify(journey.fromLocation)}</p>



      {/* Journey Route */}
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
          {journey.fromLocation || "Starting location not specified"}
          {" → "}
          {journey.destination}
        </h3>
      </div>

      <p>
        <strong>Vehicle:</strong>{" "}
        {journey.vehicle}
      </p>

      <p>
        <strong>Available seats:</strong>{" "}
        {journey.seatsAvailable}
      </p>

      <p>
        <strong>Expires:</strong>{" "}
        {new Date(journey.expiresAt).toLocaleString()}
      </p>

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
