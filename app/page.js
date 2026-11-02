
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    destination: "",
    phone: "",
    vehicle: "Bike",
    seatsAvailable: "1",
  });

  const [journeys, setJourneys] = useState([]);
  const [message, setMessage] = useState("");

  // Seat request states
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    seatsRequested: "1",
  });
  const [requestMessage, setRequestMessage] = useState("");
  const [requesting, setRequesting] = useState(false);

  async function loadJourneys() {
    try {
      const res = await fetch("/api/journeys", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) setJourneys(data);
    } catch (error) {
      console.error("Loading error:", error);
    }
  }

  useEffect(() => {
    loadJourneys();

    const timer = setInterval(loadJourneys, 10000);

    return () => clearInterval(timer);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("Submitting...");

    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(
          "Error " + res.status + ": " +
          (data.error || "Submission failed")
        );
        return;
      }

      setMessage("Journey shared successfully!");

      setForm({
        name: "",
        destination: "",
        phone: "",
        vehicle: "Bike",
        seatsAvailable: "1",
      });

      loadJourneys();
    } catch (error) {
      setMessage("Network error: " + error.message);
    }
  }

  function openRequestForm(journey) {
    setSelectedJourney(journey);

    setRequestForm({
      name: "",
      phone: "",
      seatsRequested: "1",
    });

    setRequestMessage("");
  }

  async function handleRequestSubmit(e) {
    e.preventDefault();

    if (!selectedJourney) return;

    setRequesting(true);
    setRequestMessage("Submitting request...");

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journeyId: selectedJourney.id,
          ...requestForm,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setRequestMessage(
          data.error || "Unable to submit request"
        );
        return;
      }

      setRequestMessage("Seat request submitted successfully!");

      setTimeout(() => {
        setSelectedJourney(null);
        loadJourneys();
      }, 1200);

    } catch (error) {
      setRequestMessage("Network error: " + error.message);
    } finally {
      setRequesting(false);
    }
  }

  return (
    <main>
      <h1>Journey Share</h1>
      <p>Share your journey with others</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Your name"
          value={form.name}
          onChange={(e) =>
            setForm({ ...form, name: e.target.value })
          }
          required
        />

        <input
          placeholder="Where are you heading?"
          value={form.destination}
          onChange={(e) =>
            setForm({ ...form, destination: e.target.value })
          }
          required
        />

        <input
          placeholder="Phone number"
          type="tel"
          value={form.phone}
          onChange={(e) =>
            setForm({ ...form, phone: e.target.value })
          }
          required
        />

        <select
          value={form.vehicle}
          onChange={(e) =>
            setForm({ ...form, vehicle: e.target.value })
          }
        >
          <option value="Bike">Bike</option>
          <option value="Car">Car</option>
        </select>

        <label>
          Available passenger seats (excluding you)
        </label>

        <input
          type="number"
          min="1"
          max="10"
          placeholder="How many passengers can you carry?"
          value={form.seatsAvailable}
          onChange={(e) =>
            setForm({
              ...form,
              seatsAvailable: e.target.value,
            })
          }
          required
        />

        <button type="submit">
          Share My Journey
        </button>
      </form>

      <p>{message}</p>

      <h2>Active Journeys ({journeys.length})</h2>

      {journeys.map((item) => (
        <article key={item.id}>
          <h3>{item.name}</h3>

          <p>Heading to: {item.destination}</p>
          <p>Phone: {item.phone}</p>
          <p>Vehicle: {item.vehicle}</p>
          <p>Available seats: {item.seatsAvailable}</p>

          <small>
            Expires: {new Date(item.expiresAt).toLocaleString()}
          </small>

          <button
            type="button"
            disabled={Number(item.seatsAvailable) <= 0}
            onClick={() => openRequestForm(item)}
            style={{
              width: "100%",
              marginTop: "15px",
              opacity:
                Number(item.seatsAvailable) <= 0 ? 0.5 : 1,
            }}
          >
            {Number(item.seatsAvailable) <= 0
              ? "No Seats Available"
              : "Request Seats"}
          </button>
        </article>
      ))}

      {selectedJourney && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              width: "100%",
              maxWidth: "420px",
              padding: "22px",
              borderRadius: "15px",
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Request Seats
            </h2>

            <p>
              Journey by <strong>{selectedJourney.name}</strong>
            </p>

            <p>
              Destination: {selectedJourney.destination}
            </p>

            <p>
              Available seats: {selectedJourney.seatsAvailable}
            </p>

            <form onSubmit={handleRequestSubmit}>
              <input
                placeholder="Your name"
                value={requestForm.name}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="tel"
                placeholder="Your phone number"
                value={requestForm.phone}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    phone: e.target.value,
                  })
                }
                required
              />

              <label>Number of seats required</label>

              <input
                type="number"
                min="1"
                max={selectedJourney.seatsAvailable}
                value={requestForm.seatsRequested}
                onChange={(e) =>
                  setRequestForm({
                    ...requestForm,
                    seatsRequested: e.target.value,
                  })
                }
                required
              />

              <button
                type="submit"
                disabled={requesting}
              >
                {requesting ? "Sending..." : "Submit Request"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedJourney(null)}
                style={{
                  background: "#64748b",
                  marginTop: "8px",
                  width: "100%",
                }}
              >
                Cancel
              </button>
            </form>

            <p>{requestMessage}</p>
          </div>
        </div>
      )}
    </main>
  );
            }
              
