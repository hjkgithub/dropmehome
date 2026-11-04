
"use client";

import JourneyCard from "./JourneyCard";

export default function PassengerDashboard({
  journeys,
  onRequest,
}) {
  return (
    <section>
      <h2>
        Available Rides ({journeys.length})
      </h2>

      {journeys.length === 0 && (
        <p>No active journeys available right now.</p>
      )}

      {journeys.map((journey) => (
        <JourneyCard
          key={journey.id}
          journey={journey}
          onRequest={onRequest}
        />
      ))}
    </section>
  );
}

