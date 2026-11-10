
"use client";

import { useState } from "react";
import JourneyCard from "./JourneyCard";

export default function PassengerDashboard({
  journeys,
  onRequest,
  myRequests = [],
  userEmail,
}) {
  const [search, setSearch] = useState("");

  const otherJourneys = journeys.filter(
    (journey) => journey.ownerEmail !== userEmail
  );

  const filteredJourneys = otherJourneys.filter((journey) => {
    const searchText = search.toLowerCase().trim();

    return (
      (journey.name || "").toLowerCase().includes(searchText) ||
      (journey.fromLocation || "").toLowerCase().includes(searchText) ||
      (journey.destination || "").toLowerCase().includes(searchText) ||
      (journey.vehicle || "").toLowerCase().includes(searchText)
    );
  });

  return (
    <section>
      <h2>Passenger Dashboard</h2>

      <h3>My Ride Requests</h3>

      {myRequests.length === 0 && (
        <p>You haven't requested any rides yet.</p>
      )}

      {myRequests.map((request) => (
        <article
          key={request.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "10px",
          }}
        >
          <h4>{request.journey?.destination || "Ride request"}</h4>
          <p>
            <strong>Vehicle:</strong>{" "}
            {request.journey?.vehicle || "Not available"}
          </p>
          <p>
            <strong>Seats requested:</strong>{" "}
            {request.seatsRequested}
          </p>
          <p>
            <strong>Status:</strong> {request.status}
          </p>
        </article>
      ))}

      <h3>Available Rides ({filteredJourneys.length})</h3>

      <input
        type="text"
        placeholder="Search driver, location, destination or vehicle..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "13px",
          border: "1px solid #ccc",
          borderRadius: "8px",
          marginBottom: "15px",
          boxSizing: "border-box",
          fontSize: "15px",
        }}
      />

      {filteredJourneys.length === 0 && (
        <p>
          {search
            ? "No matching rides found. Try another search."
            : "No available rides right now."}
        </p>
      )}

      {filteredJourneys.map((journey) => {
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
