
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [form, setForm] = useState({
    name: "",
    destination: "",
    phone: "",
    vehicle: "Bike",
  });

  const [journeys, setJourneys] = useState([]);
  const [message, setMessage] = useState("");

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

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text.slice(0, 300) };
      }

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
      });

      loadJourneys();

    } catch (error) {
      setMessage("Network error: " + error.message);
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
          <small>
            Expires: {new Date(item.expiresAt).toLocaleString()}
          </small>
        </article>
      ))}
    </main>
  );
            }
            
