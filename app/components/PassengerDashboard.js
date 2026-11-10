
"use client";

import JourneyCard from "./JourneyCard";

export default function PassengerDashboard({
  journeys,
  onRequest,
  myRequests = [],
  userEmail,
}) {
  const otherJourneys = journeys.filter(
    (journey) => journey.ownerEmail !== userEmail
  );

  return (
    <section>
      {/* MY REQUESTS */}
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "14px",
        marginBottom: "25px",
        border: "1px solid #e6edf6",
      }}>
        <h2 style={{ color: "#173b70" }}>
          My Ride Requests ({myRequests.length})
        </h2>

        {myRequests.length === 0 && (
          <p style={{ color: "#718096" }}>
            You haven't requested any rides yet.
          </p>
        )}

        {myRequests.map((request) => {
          const status = String(request.status || "")
            .toLowerCase();

          const accepted = status === "accepted";
          const rejected = status === "rejected";

          return (
            <div
              key={request.id}
              style={{
                padding: "15px",
                marginTop: "12px",
                borderRadius: "10px",
                border: "1px solid #e6edf6",
                background: "#f9fbff",
              }}
            >
              <h3 style={{
                margin: "0 0 8px",
                color: "#173b70",
              }}>
                {request.journey?.destination || "Your requested journey"}
              </h3>

              <p style={{
                margin: "5px 0",
                color: "#65758b",
                fontSize: "14px",
              }}>
                Seats requested: {request.seatsRequested}
              </p>

              <p style={{
                margin: "5px 0",
                color: "#65758b",
                fontSize: "14px",
              }}>
                Vehicle: {request.journey?.vehicle || "N/A"}
              </p>

              <div style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "7px 13px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "bold",
                background: accepted
                  ? "#dcfce7"
                  : rejected
                  ? "#fee2e2"
                  : "#fef3c7",
                color: accepted
                  ? "#166534"
                  : rejected
                  ? "#991b1b"
                  : "#92400e",
              }}>
                {accepted
                  ? "✓ Driver Accepted"
                  : rejected
                  ? "✕ Driver Rejected"
                  : "⏳ Waiting for Driver"}
              </div>

              {accepted && (
                <p style={{
                  color: "#166534",
                  fontSize: "13px",
                  marginBottom: 0,
                }}>
                  Great! Your ride request has been accepted.
                </p>
              )}

              {rejected && (
                <p style={{
                  color: "#991b1b",
                  fontSize: "13px",
                  marginBottom: 0,
                }}>
                  Your request was rejected. You can look for another ride.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* AVAILABLE RIDES */}
      <h2>
        Available Rides ({otherJourneys.length})
      </h2>

      {otherJourneys.length === 0 && (
        <p>No other active journeys available right now.</p>
      )}

      {otherJourneys.map((journey) => {
        const request = myRequests.find(
          (item) =>
            item.journeyId === journey.id &&
            ["pending", "accepted"].includes(
              String(item.status).toLowerCase()
            )
        );

        return (
          <JourneyCard
            key={journey.id}
            journey={journey}
            onRequest={onRequest}
            canViewLiveLocation={!!request}
          />
        );
      })}
    </section>
  );
}
