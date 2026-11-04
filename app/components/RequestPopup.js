
"use client";

export default function RequestPopup({
  journey,
  requestForm,
  setRequestForm,
  onSubmit,
  onClose,
  loading,
  message,
}) {
  if (!journey) return null;

  function updateField(field, value) {
    setRequestForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          color: "black",
          padding: "20px",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <h2>Request Seats</h2>

        <p>
          Destination: <strong>{journey.destination}</strong>
        </p>

        <input
          type="text"
          placeholder="Your name"
          value={requestForm.name}
          onChange={(e) =>
            updateField("name", e.target.value)
          }
          required
        />

        <input
          type="tel"
          placeholder="Phone number"
          value={requestForm.phone}
          onChange={(e) =>
            updateField("phone", e.target.value)
          }
          required
        />

        <input
          type="number"
          min="1"
          max={journey.seatsAvailable}
          value={requestForm.seatsRequested}
          onChange={(e) =>
            updateField("seatsRequested", e.target.value)
          }
          required
        />

        {message && <p>{message}</p>}

        <button
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Request"}
        </button>

        <button
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

