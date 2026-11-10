
"use client";

import JourneyCard from "./JourneyCard";

export default function PassengerDashboard({
  journeys,
  onRequest,
  myRequests = [],
  userEmail,
}) {
  const otherJourneys = journeys.filter(
    (journey) =>
      journey.ownerEmail !== userEmail
  );

  return (
    <section>
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
