
"use client";

import RequestCard from "./RequestCard";

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

      {/* PUBLISH JOURNEY */}

      <h3>Publish a Journey</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPublish();
        }}
      >
        <input
          type="text"
          placeholder="Destination"
          value={journeyForm.destination}
          onChange={(e) =>
            updateField("destination", e.target.value)
          }
          required
        />

        <input
          type="tel"
          placeholder="Phone number"
          value={journeyForm.phone}
          onChange={(e) =>
            updateField("phone", e.target.value)
          }
          required
        />

        <select
          value={journeyForm.vehicle}
          onChange={(e) =>
            updateField("vehicle", e.target.value)
          }
        >
          <option value="Bike">Bike</option>
          <option value="Car">Car</option>
        </select>

        <input
          type="number"
          min="1"
          max="10"
          placeholder="Available seats"
          value={journeyForm.seatsAvailable}
          onChange={(e) =>
            updateField("seatsAvailable", e.target.value)
          }
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Publishing..." : "Publish Journey"}
        </button>
      </form>

      {message && <p>{message}</p>}

       <h3>Active Journeys ({journeys.length})</h3>

{journeys.length === 0 && (
  <p>No active journeys available.</p>
)}

{journeys.map((journey) => (
  <article
   <p>Available seats: {journey.seatsAvailable}</p>
 <button
  onClick={() => {
    if (window.confirm("Are you sure you want to delete this journey?")) {
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
    key={journey.id}
    style={{
      border: "1px solid #ddd",
      borderRadius: "10px",
      padding: "15px",
      marginBottom: "15px",
    }}
  >
    <h4>{journey.name}</h4>
    <p>Destination: {journey.destination}</p>
    <p>Vehicle: {journey.vehicle}</p>
    <p>Available seats: {journey.seatsAvailable}</p>
  </article>
))}

       

      {/* PASSENGER REQUESTS */}

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

