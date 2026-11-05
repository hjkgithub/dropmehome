
"use client";

import { useState } from "react";

export default function PassengerLocation({ onLocation }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function shareLocation() {
    if (!navigator.geolocation) {
      setMessage("GPS is not supported by this browser.");
      return;
    }

    setLoading(true);
    setMessage("Getting your location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        onLocation(location);
        setMessage("Location shared successfully!");
        setLoading(false);
      },
      (error) => {
        setMessage(error.message || "Unable to get location.");
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={shareLocation}
        disabled={loading}
      >
        {loading ? "Getting location..." : "Share My Current Location"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
      }

