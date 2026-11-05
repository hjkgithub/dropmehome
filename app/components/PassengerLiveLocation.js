"use client";

import { useEffect, useState } from "react";

export default function PassengerLiveLocation({ journeyId }) {
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(
    "Waiting for driver's location..."
  );

  useEffect(() => {
    if (!journeyId) return;

    let active = true;

    async function loadLocation() {
      try {
        const response = await fetch(
          `/api/live-location?journeyId=${encodeURIComponent(journeyId)}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          if (active) {
            setStatus(
              response.status === 403
                ? "Submit a seat request to view the driver's location."
                : "Unable to access driver's location."
            );
          }
          return;
        }

        const data = await response.json();

        if (!active) return;

        if (!data.location) {
          setLocation(null);
          setStatus("Waiting for driver to start GPS sharing...");
          return;
        }

        setLocation(data.location);
        setStatus("Driver's location is updating.");
      } catch {
        if (active) {
          setStatus("Connection problem. Retrying...");
        }
      }
    }

    loadLocation();

    const interval = setInterval(loadLocation, 8000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [journeyId]);

  const mapUrl = location
    ? `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=16/${location.latitude}/${location.longitude}`
    : null;

  return (
    <div
      style={{
        marginTop: "15px",
        padding: "12px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h3>Driver Live Location</h3>

      <p>{status}</p>

      {location && (
        <>
          <p style={{ fontSize: "12px", color: "#666" }}>
            Last updated:{" "}
            {new Date(location.updatedAt).toLocaleTimeString()}
          </p>

          <iframe
            title="Driver live location"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.01}%2C${location.latitude - 0.01}%2C${location.longitude + 0.01}%2C${location.latitude + 0.01}&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
            width="100%"
            height="250"
            style={{ border: 0 }}
            loading="lazy"
          />

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open larger map
          </a>
        </>
      )}
    </div>
  );
        }
