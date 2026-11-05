
"use client";

import RequestCard from "./RequestCard";
import JourneyForm from "./JourneyForm";

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
    }}
  >
    <h4>{journey.name}</h4>

    <p>Destination: {journey.destination}</p>
    <p>Vehicle: {journey.vehicle}</p>
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

