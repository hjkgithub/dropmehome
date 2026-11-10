
"use client";

import RequestCard from "./RequestCard";
import JourneyForm from "./JourneyForm";
import DriverLiveLocation from "./DriverLiveLocation";

export default function DriverDashboard({
  journeys,
  onDelete,
  journeyForm,
  setJourneyForm,
  onPublish,
  driverRequests,
  onAction,
  loading,
  actionLoading,
  message,
}) {
  function updateField(field, value) {
    setJourneyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function formatDateTime(timestamp) {
    if (
      !timestamp ||
      !Number.isFinite(Number(timestamp)) ||
      Number(timestamp) <= 0
    ) {
      return "Time unavailable";
    }

    return new Date(Number(timestamp)).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const pending = driverRequests.filter(
    (item) => item.status === "Pending"
  ).length;

  const accepted = driverRequests.filter(
    (item) => item.status === "Accepted"
  ).length;

  const rejected = driverRequests.filter(
    (item) => item.status === "Rejected"
  ).length;

  return (
    <section>
      <h2>Driver Dashboard</h2>

      <h3>Publish a Journey</h3>

      <JourneyForm
        journeyForm={journeyForm}
        setJourneyForm={setJourneyForm}
        onPublish={onPublish}
        loading={loading}
      />

      {message && <p>{message}</p>}

      <h3>Active Journeys ({journeys.length})</h3>

      {journeys.length === 0 && (
        <p>No active journeys available.</p>
      )}

      {journeys.map((journey) => (
        <article
          key={journey.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "15px",
            background: "#fff",
            color: "#222",
          }}
        >
          <h4>{journey.name}</h4>

          <p>
            <strong>Starting from:</strong>{" "}
            {journey.fromLocation}
          </p>

          <p>
            <strong>Destination:</strong>{" "}
            {journey.destination}
          </p>

          <p>
            <strong>Vehicle:</strong> {journey.vehicle}
          </p>

          <p>
            <strong>Available seats:</strong>{" "}
            {journey.seatsAvailable}
          </p>

          <div
            style={{
              background: "#f3f7ff",
              padding: "12px",
              borderRadius: "8px",
              marginTop: "12px",
            }}
          >
            <p>
              <strong>Posted date & time:</strong>
              <br />
              {formatDateTime(journey.createdAt)} IST
            </p>

            <p style={{ marginBottom: 0 }}>
              <strong>Expires at:</strong>
              <br />
              {formatDateTime(journey.expiresAt)} IST
            </p>
          </div>

          {/* DRIVER LIVE GPS SHARING */}
          <DriverLiveLocation journeyId={journey.id} />

          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this journey?"
                )
              ) {
                onDelete(journey.id);
              }
            }}
            style={{
              background: "red",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "6px",
              marginTop: "10px",
            }}
          >
            Delete Journey
          </button>
        </article>
      ))}

      <h3>Passenger Requests</h3>

      <p>Pending: {pending}</p>
      <p>Accepted: {accepted}</p>
      <p>Rejected: {rejected}</p>

      {driverRequests.length === 0 && (
        <p>No passenger requests yet.</p>
      )}

      {driverRequests.map((request) => (
        <RequestCard
          key={request.id}
          request={request}
          onAction={onAction}
          loading={actionLoading}
        />
      ))}
    </section>
  );
}
