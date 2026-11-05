
"use client";

export default function RequestCard({
  request,
  onAction,
  loading,
}) {
  const location = request.passengerLocation;

  const mapUrl = location
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : null;

  return (
    <article
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "15px",
        marginBottom: "15px",
      }}
    >
      <h3>{request.name}</h3>

      <p>
        <strong>Phone:</strong> {request.phone}
      </p>

      <p>
        <strong>Destination:</strong>{" "}
        {request.journey?.destination}
      </p>

      <p>
        <strong>Vehicle:</strong> {request.journey?.vehicle}
      </p>

      <p>
        <strong>Seats requested:</strong>{" "}
        {request.seatsRequested}
      </p>

      <p>
        <strong>Status:</strong> {request.status}
      </p>

      {mapUrl ? (
        <p>
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "blue", fontWeight: "bold" }}
          >
            View Passenger Location on Map
          </a>
        </p>
      ) : (
        <p>Passenger has not shared GPS location.</p>
      )}

      {request.status === "Pending" && (
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onAction(request, "accept")}
            disabled={loading}
            style={{
              background: "green",
              color: "white",
              padding: "10px",
            }}
          >
            Accept
          </button>

          <button
            onClick={() => onAction(request, "reject")}
            disabled={loading}
            style={{
              background: "red",
              color: "white",
              padding: "10px",
            }}
          >
            Reject
          </button>
        </div>
      )}
    </article>
  );
              }
