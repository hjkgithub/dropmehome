
"use client";

import JourneyCard from "./JourneyCard";

export default function PassengerDashboard({
  journeys,
  onRequest,
  myRequests = [],
}) {
  return (
    <section>
      <h2>
        Available Rides ({journeys.length})
      </h2>

      {journeys.length === 0 && (
        <p>No active journeys available right now.</p>
      )}

      {journeys.map((journey) => {
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
