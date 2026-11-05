
"use client";

export default function JourneyForm({
  journeyForm,
  setJourneyForm,
  onPublish,
  loading,
}) {
  function updateField(field, value) {
    setJourneyForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div>
      <h3>Publish a Journey</h3>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPublish();
        }}
      >
        <input
          type="text"
          placeholder="Where are you now? (Starting location)"
          value={journeyForm.fromLocation}
          onChange={(e) =>
            updateField("fromLocation", e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Where are you going? (Destination)"
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
    </div>
  );
            }

