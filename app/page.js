
"use client";

import { useState, useEffect } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f1f5f9",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
    padding: "24px 16px",
  },
  container: {
    maxWidth: "650px",
    margin: "0 auto",
  },
  card: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    marginTop: "18px",
    boxShadow: "0 4px 18px #0000000b",
  },
  input: {
    width: "100%",
    padding: "14px",
    marginTop: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "15px",
    marginTop: "14px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondary: {
    width: "100%",
    padding: "15px",
    marginTop: "12px",
    background: "#e2e8f0",
    color: "#172033",
    border: "none",
    borderRadius: "10px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default function Home() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const [screen, setScreen] = useState("home");
  const [role, setRole] = useState("passenger");
  const [authMode, setAuthMode] = useState("register");

  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [journeys, setJourneys] = useState([]);
  const [journeyMessage, setJourneyMessage] = useState("");

  const [journeyForm, setJourneyForm] = useState({
    destination: "",
    phone: "",
    vehicle: "Bike",
    seatsAvailable: "1",
  });

  const [selectedJourney, setSelectedJourney] = useState(null);

  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    seatsRequested: "1",
  });

  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  // Check existing session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch("/api/auth", {
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok && data.user) {
          setUser(data.user);
          setScreen("dashboard");
        }
      } catch (error) {
        console.error("Session error:", error);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, []);

  // Load active journeys
  async function loadJourneys() {
    try {
      const res = await fetch("/api/journeys", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && Array.isArray(data)) {
        setJourneys(data);
      }
    } catch (error) {
      console.error("Journey loading error:", error);
    }
  }

  useEffect(() => {
    if (!user) return;

    loadJourneys();

    const timer = setInterval(loadJourneys, 10000);

    return () => clearInterval(timer);
  }, [user]);

  // Registration and login
  async function handleAuth(e) {
    e.preventDefault();

    setLoading(true);
    setAuthMessage(
      authMode === "register"
        ? "Creating your account..."
        : "Logging in..."
    );

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: authMode,
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAuthMessage(data.error || "Something went wrong");
        return;
      }

      setUser(data.user);
      setScreen("dashboard");
      setAuthMessage("");
      setAuthForm({
        name: "",
        email: "",
        password: "",
      });

    } catch (error) {
      setAuthMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Logout
  async function handleLogout() {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
      });

      setUser(null);
      setScreen("home");
      setJourneys([]);
      setSelectedJourney(null);

    } catch (error) {
      alert("Unable to log out. Please try again.");
    }
  }

  // Publish journey
  async function handleJourneySubmit(e) {
    e.preventDefault();

    setJourneyMessage("Publishing journey...");

    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.name,
          destination: journeyForm.destination,
          phone: journeyForm.phone,
          vehicle: journeyForm.vehicle,
          seatsAvailable: journeyForm.seatsAvailable,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setJourneyMessage(data.error || "Unable to publish");
        return;
      }

      setJourneyMessage("Your journey has been published!");

      setJourneyForm({
        destination: "",
        phone: "",
        vehicle: "Bike",
        seatsAvailable: "1",
      });

      loadJourneys();

    } catch (error) {
      setJourneyMessage("Network error. Please try again.");
    }
  }

  // Open seat request popup
  function openRequest(journey) {
    setSelectedJourney(journey);

    setRequestForm({
      name: user.name,
      phone: "",
      seatsRequested: "1",
    });

    setRequestMessage("");
  }

  // Submit seat request
  async function handleRequestSubmit(e) {
    e.preventDefault();

    if (!selectedJourney) return;

    setRequestLoading(true);
    setRequestMessage("Sending request...");

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
        setRequestMessage(data.error || "Request failed");
        return;
      }

      setRequestMessage("Your seat request was submitted!");

      setTimeout(() => {
        setSelectedJourney(null);
        loadJourneys();
      }, 1200);

    } catch (error) {
      setRequestMessage("Network error. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  }

  if (checking) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <h2>Journey Share</h2>
          <p>Loading your account...</p>
        </div>
      </main>
    );
  }

  // HOMEPAGE
  if (!user && screen === "home") {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <div style={{
            textAlign: "center",
            padding: "45px 10px 30px",
          }}>
            <div style={{ fontSize: "52px" }}>🚘</div>

            <h1 style={{
              fontSize: "36px",
              color: "#173b70",
              marginBottom: "10px",
            }}>
              Journey Share
            </h1>

            <p style={{ color: "#64748b" }}>
              Find a ride. Share a ride. Travel together.
            </p>
          </div>

          <div
            style={{
              ...styles.card,
              cursor: "pointer",
              border: "2px solid #bfdbfe",
            }}
            onClick={() => {
              setRole("passenger");
              setAuthMode("register");
              setScreen("auth");
              setAuthMessage("");
            }}
          >
            <div style={{ fontSize: "38px" }}>🙋</div>

            <h2>I want to be dropped</h2>

            <p style={{ color: "#64748b" }}>
              Find people travelling to your destination
              and request a seat.
            </p>

            <button style={styles.button}>
              Find a Ride →
            </button>
          </div>

          <div
            style={{
              ...styles.card,
              cursor: "pointer",
              border: "2px solid #bfdbfe",
            }}
            onClick={() => {
              setRole("driver");
              setAuthMode("register");
              setScreen("auth");
              setAuthMessage("");
            }}
          >
            <div style={{ fontSize: "38px" }}>🚗</div>

            <h2>I can drop people</h2>

            <p style={{ color: "#64748b" }}>
              Share your journey and tell others
              how many passengers you can carry.
            </p>

            <button style={styles.button}>
              Share My Journey →
            </button>
          </div>

          <p style={{
            textAlign: "center",
            color: "#64748b",
            marginTop: "30px",
          }}>
            New here? Create an account to get started.
          </p>
        </div>
      </main>
    );
  }

  // SIGNUP AND LOGIN SCREEN
  if (!user && screen === "auth") {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <button
            style={styles.secondary}
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <div style={styles.card}>
            <h1>
              {authMode === "register"
                ? "Create your account"
                : "Welcome back"}
            </h1>

            <p style={{ color: "#64748b" }}>
              {role === "passenger"
                ? "Passenger account"
                : "Driver account"}
            </p>

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <input
                  style={styles.input}
                  placeholder="Your full name"
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                  required
                />
              )}

              <input
                style={styles.input}
                type="email"
                placeholder="Email address"
                value={authForm.email}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    email: e.target.value,
                  })
                }
                required
              />

              <input
                style={styles.input}
                type="password"
                placeholder="Password (minimum 8 characters)"
                value={authForm.password}
                onChange={(e) =>
                  setAuthForm({
                    ...authForm,
                    password: e.target.value,
                  })
                }
                minLength={8}
                maxLength={128}
                required
              />

              <button
                style={styles.button}
                type="submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : authMode === "register"
                  ? "Create Account"
                  : "Login"}
              </button>
            </form>

            <p style={{ color: "#dc2626" }}>
              {authMessage}
            </p>

            <button
              style={styles.secondary}
              onClick={() => {
                setAuthMode(
                  authMode === "register"
                    ? "login"
                    : "register"
                );
                setAuthMessage("");
              }}
            >
              {authMode === "register"
                ? "Already have an account? Login"
                : "New here? Create an account"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // DASHBOARD
  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}>
          <div>
            <h1 style={{
              color: "#173b70",
              marginBottom: "5px",
            }}>
              Journey Share
            </h1>

            <small style={{ color: "#64748b" }}>
              Welcome, {user.name}
            </small>
          </div>

          <button
            onClick={handleLogout}
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              border: "none",
              padding: "10px 14px",
              borderRadius: "9px",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </header>

        <div style={styles.card}>
          <h2>
            {user.role === "driver"
              ? "🚗 Driver Dashboard"
              : "🙋 Passenger Dashboard"}
          </h2>

          <p style={{ color: "#64748b" }}>
            {user.email}
          </p>

          <p style={{
            color: "#15803d",
            fontWeight: "bold",
          }}>
            Your session lasts 3 hours.
          </p>
        </div>

        {/* DRIVER FORM */}
        {user.role === "driver" && (
          <div style={styles.card}>
            <h2>Share Your Journey</h2>

            <form onSubmit={handleJourneySubmit}>
              <input
                style={styles.input}
                placeholder="Where are you heading?"
                value={journeyForm.destination}
                onChange={(e) =>
                  setJourneyForm({
                    ...journeyForm,
                    destination: e.target.value,
                  })
                }
                required
              />

              <input
                style={styles.input}
                type="tel"
                placeholder="Your phone number"
                value={journeyForm.phone}
                onChange={(e) =>
                  setJourneyForm({
                    ...journeyForm,
                    phone: e.target.value,
                  })
                }
                required
              />

              <select
                style={styles.input}
                value={journeyForm.vehicle}
                onChange={(e) =>
                  setJourneyForm({
                    ...journeyForm,
                    vehicle: e.target.value,
                  })
                }
              >
                <option value="Bike">Bike</option>
                <option value="Car">Car</option>
              </select>

              <label>
                Available passenger seats
              </label>

              <input
                style={styles.input}
                type="number"
                min="1"
                max="10"
                value={journeyForm.seatsAvailable}
                onChange={(e) =>
                  setJourneyForm({
                    ...journeyForm,
                    seatsAvailable: e.target.value,
                  })
                }
                required
              />

              <button style={styles.button}>
                Publish My Journey
              </button>
            </form>

            <p>{journeyMessage}</p>
          </div>
        )}

        {/* ACTIVE JOURNEYS */}
        <h2 style={{ marginTop: "30px" }}>
          {user.role === "driver"
            ? "Community Journeys"
            : "Available Rides"}
          {" "}({journeys.length})
        </h2>

        {journeys.length === 0 && (
          <div style={styles.card}>
            <p>No active journeys available right now.</p>
          </div>
        )}

        {journeys.map((item) => (
          <article
            key={item.id}
            style={{
              ...styles.card,
              borderLeft: "5px solid #2563eb",
            }}
          >
            <h3>{item.name}</h3>

            <p>
              <strong>Destination:</strong>{" "}
              {item.destination}
            </p>

            <p>
              <strong>Vehicle:</strong>{" "}
              {item.vehicle}
            </p>

            <p>
              <strong>Available seats:</strong>{" "}
              {item.seatsAvailable}
            </p>

            <small style={{ color: "#64748b" }}>
              Expires:{" "}
              {new Date(item.expiresAt).toLocaleString()}
            </small>

            {user.role === "passenger" && (
              <button
                style={styles.button}
                disabled={Number(item.seatsAvailable) <= 0}
                onClick={() => openRequest(item)}
              >
                {Number(item.seatsAvailable) <= 0
                  ? "No Seats Available"
                  : "Request Seats"}
              </button>
            )}
          </article>
        ))}

        {/* REQUEST POPUP */}
        {selectedJourney && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "#0009",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            zIndex: 1000,
          }}>
            <div style={{
              background: "white",
              padding: "24px",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "420px",
            }}>
              <h2>Request Seats</h2>

              <p>
                Journey by {selectedJourney.name}
              </p>

              <p>
                Destination: {selectedJourney.destination}
              </p>

              <p>
                Available seats: {selectedJourney.seatsAvailable}
              </p>

              <form onSubmit={handleRequestSubmit}>
                <input
                  style={styles.input}
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
                  style={styles.input}
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

                <input
                  style={styles.input}
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
                  style={styles.button}
                  disabled={requestLoading}
                >
                  {requestLoading
                    ? "Sending..."
                    : "Submit Request"}
                </button>
              </form>

              <p>{requestMessage}</p>

              <button
                style={styles.secondary}
                onClick={() => setSelectedJourney(null)}
              >
                Close
           </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
