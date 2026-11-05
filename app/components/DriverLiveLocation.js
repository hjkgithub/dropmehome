"use client";

import { useRef, useState } from "react";

export default function DriverLiveLocation({ journeyId }) {
  const watchId = useRef(null);
  const lastSent = useRef(0);
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("Location sharing is off.");

  async function sendLocation(latitude, longitude) {
    try {
      const response = await fetch("/api/live-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        setStatus("Unable to share location. Please try again.");
        return;
      }

      setStatus("Live location is being shared.");
    } catch {
      setStatus("Network error while sharing location.");
    }
  }

  function startSharing() {
    if (!navigator.geolocation) {
      setStatus("GPS location is not supported by this browser.");
      return;
    }

    if (watchId.current !== null) return;

    setStatus("Getting your GPS location...");

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();

        // Send an update at most once every 8 seconds.
        if (now - lastSent.current < 8000) return;

        lastSent.current = now;

        sendLocation(
          position.coords.latitude,
          position.coords.longitude
        );
      },
      (error) => {
        setStatus("GPS error: " + error.message);
        watchId.current = null;
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 20000,
      }
    );

    setSharing(true);
  }

  async function stopSharing() {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    setSharing(false);
    lastSent.current = 0;

    try {
      const response = await fetch("/api/live-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyId,
          action: "stop",
        }),
      });

      if (!response.ok) {
        setStatus("GPS stopped on this device, but the server could not be updated.");
        return;
      }

      setStatus("Live location sharing stopped.");
    } catch {
      setStatus("GPS stopped on this device. Server update failed.");
    }
  }

  return (
    <div className="mt-3 rounded-lg border p-3">
      <h3 className="font-semibold">Live GPS Tracking</h3>

      <p className="my-2 text-sm" aria-live="polite">
        {status}
      </p>

      {!sharing ? (
        <button
          type="button"
          onClick={startSharing}
          className="rounded-lg bg-green-600 px-4 py-2 text-white"
        >
          Start Live Location
        </button>
      ) : (
        <button
          type="button"
          onClick={stopSharing}
          className="rounded-lg bg-red-600 px-4 py-2 text-white"
        >
          Stop Sharing
        </button>
      )}
    </div>
  );
}
