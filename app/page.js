
"use client";

import { useState, useEffect } from "react";

import AuthForm from "./components/AuthForm";
import DriverDashboard from "./components/DriverDashboard";
import PassengerDashboard from "./components/PassengerDashboard";
import RequestPopup from "./components/RequestPopup";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fc",
    color: "#172b4d",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    maxWidth: "1100px",
    margin: "auto",
    padding: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  brand: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#173b70",
    margin: 0,
  },
  hero: {
    maxWidth: "1100px",
    margin: "15px auto 35px",
    padding: "55px 25px",
    borderRadius: "24px",
    background: "linear-gradient(130deg, #102c54, #1764a5, #368cba)",
    color: "white",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  eyebrow: {
    display: "inline-block",
    background: "rgba(255,255,255,0.15)",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "12px",
    letterSpacing: "1.5px",
    fontWeight: "bold",
  },
  heroTitle: {
    fontSize: "clamp(34px, 7vw, 58px)",
    lineHeight: "1.12",
    margin: "22px 0 14px",
    fontWeight: "800",
  },
  heroText: {
    maxWidth: "600px",
    margin: "auto",
    lineHeight: "1.7",
    fontSize: "16px",
    color: "#e1efff",
  },
  cards: {
    maxWidth: "1000px",
    margin: "auto",
    padding: "0 20px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },
  card: {
    background: "white",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 30px rgba(24,55,95,0.08)",
    border: "1px solid #e6edf6",
  },
  cardIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "23px",
    margin: "5px 0 10px",
    color: "#173b70",
  },
  cardText: {
    color: "#65758b",
    lineHeight: "1.7",
    minHeight: "55px",
  },
  primaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "18px",
    border: "none",
    borderRadius: "10px",
    background: "#1764c0",
    color: "white",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "18px",
    border: "none",
    borderRadius: "10px",
    background: "#173b70",
    color: "white",
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
  const [authLoading, setAuthLoading] = useState(false);

  const [journeys, setJourneys] = useState([]);

  const [journeyForm, setJourneyForm] = useState({
    fromLocation: "",
    destination: "",
    phone: "",
    vehicle: "Bike",
    seatsAvailable: "1",
  });

  const [journeyMessage, setJourneyMessage] = useState("");
  const [journeyLoading, setJourneyLoading] = useState(false);

  const [selectedJourney, setSelectedJourney] = useState(null);
  const [mySharedLocation, setMySharedLocation] = useState(null);

  const [requestForm, setRequestForm] = useState({
    name: "",
    phone: "",
    seatsRequested: "1",
  });

  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const [driverRequests, setDriverRequests] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [driverRequestMessage, setDriverRequestMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/auth", {
          cache: "no-store",
        });

        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setScreen("dashboard");
        }
      } catch (error) {
        console.error("Session check failed:", error);
      } finally {
        setChecking(false);
      }
    }

    checkSession();
  }, []);

  async function loadJourneys() {
    try {
      const response = await fetch("/api/journeys", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        setJourneys(data.journeys || []);
      }
    } catch (error) {
      console.error("Journey loading failed:", error);
    }
  }

  async function loadDriverRequests() {
    try {
      const response = await fetch("/api/requests", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.ok) {
        setDriverRequests(data.requests || []);
        setDriverRequestMessage("");
      } else {
        setDriverRequestMessage(
          data.error || "Could not load requests."
        );
      }
    } catch (error) {
      setDriverRequestMessage("Could not load requests.");
    }
  }

  useEffect(() => {
    if (!user) return;

    loadJourneys();

    if (user.role === "driver") {
      loadDriverRequests();
    }

    const interval = setInterval(() => {
      loadJourneys();

      if (user.role === "driver") {
        loadDriverRequests();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  async function handleAuth() {
    setAuthLoading(true);
    setAuthMessage("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: authMode,
          ...authForm,
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthMessage(data.error || "Authentication failed.");
        return;
      }

      setUser(data.user);
      setRole(data.user.role);
      setScreen("dashboard");
      setAuthMessage("");
    } catch (error) {
      setAuthMessage("Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
      });

      setUser(null);
      setScreen("home");
      setDriverRequests([]);
      setJourneys([]);
      setMySharedLocation(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  async function handleJourneySubmit() {
    setJourneyLoading(true);
    setJourneyMessage("");

    try {
      const response = await fetch("/api/journeys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...journeyForm,
          name: user.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setJourneyMessage(data.error || "Could not publish journey.");
        return;
      }

      setJourneyMessage("Journey published successfully!");

      setJourneyForm({
        fromLocation: "",
        destination: "",
        phone: "",
        vehicle: "Bike",
        seatsAvailable: "1",
      });

      await loadJourneys();
      await loadDriverRequests();
    } catch (error) {
      setJourneyMessage("Something went wrong. Please try again.");
    } finally {
      setJourneyLoading(false);
    }
  }

  async function handleDeleteJourney(journeyId) {
    const response = await fetch("/api/journeys", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ journeyId }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.error || "Unable to delete journey");
      return;
    }

    alert("Journey deleted successfully!");

    await loadJourneys();
    await loadDriverRequests();
  }

  function openRequest(journey) {
    setSelectedJourney(journey);

    setRequestForm({
      name: user?.name || "",
      phone: "",
      seatsRequested: "1",
    });

    setRequestMessage("");
  }

  async function handleRequestSubmit(passengerLocation) {
    if (!selectedJourney) return;

    setRequestLoading(true);
    setRequestMessage("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          journeyId: selectedJourney.id,
          ...requestForm,
          passengerLocation: passengerLocation || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRequestMessage(data.error || "Request failed.");
        return;
      }

      setRequestMessage("Request submitted successfully!");
      setMySharedLocation(passengerLocation || null);
      setSelectedJourney(null);

      await loadJourneys();
    } catch (error) {
      setRequestMessage("Something went wrong. Please try again.");
    } finally {
      setRequestLoading(false);
    }
  }

  async function handleRequestAction(request, action) {
    setActionLoading(true);
    setDriverRequestMessage("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          journeyId: request.journeyId,
          requestId: request.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDriverRequestMessage(
          data.error || "Could not update request."
        );
        return;
      }

      setDriverRequestMessage(
        action === "accept"
          ? "Request accepted!"
          : "Request rejected!"
      );

      await loadDriverRequests();
      await loadJourneys();
    } catch (error) {
      setDriverRequestMessage("Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  }

  if (checking) {
    return (
      <main style={styles.page}>
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <h2>🚘 Journey Share</h2>
          <p>Getting everything ready...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.brand}>🚘 Journey Share</h1>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px" }}>
              Welcome, <strong>{user.name}</strong>
            </span>

            <button
              onClick={handleLogout}
              style={{
                background: "#173b70",
                color: "white",
                border: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        ) : screen === "auth" ? (
          <button
            onClick={() => {
              setScreen("home");
              setAuthMessage("");
            }}
            style={{
              background: "white",
              color: "#173b70",
              border: "1px solid #d5dfed",
              padding: "10px 18px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        ) : null}
      </header>

      {/* BEAUTIFUL HOME PAGE */}
      {!user && screen === "home" && (
        <>
          <section style={styles.hero}>
            <div style={styles.eyebrow}>
              YOUR JOURNEY, MADE EASIER
            </div>

            <div style={{ fontSize: "50px", marginTop: "18px" }}>
              🚗 🛣️
            </div>

            <h2 style={styles.heroTitle}>
              Every journey is<br />
              better together.
            </h2>

            <p style={styles.heroText}>
              Find a ride, share an empty seat, and connect with people
              travelling in the same direction. Make every trip easier
              with Journey Share.
            </p>
          </section>

          <section style={styles.cards}>
            {/* PASSENGER CARD */}
            <article style={styles.card}>
              <div style={styles.cardIcon}>🧍‍♂️</div>

              <p style={{
                color: "#1764c0",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}>
                FOR PASSENGERS
              </p>

              <h3 style={styles.cardTitle}>
                Looking for a ride?
              </h3>

              <p style={styles.cardText}>
                Discover available journeys, find a driver going your
                way, and request a seat with ease.
              </p>

              <button
                onClick={() => {
                  setRole("passenger");
                  setAuthMode("register");
                  setScreen("auth");
                }}
                style={styles.primaryButton}
              >
                Find a Ride →
              </button>

              <p style={{
                fontSize: "12px",
                color: "#8996a8",
                textAlign: "center",
              }}>
                Your destination is closer than you think.
              </p>
            </article>

            {/* DRIVER CARD */}
            <article style={styles.card}>
              <div style={styles.cardIcon}>🚙</div>

              <p style={{
                color: "#16845b",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "1px",
              }}>
                FOR DRIVERS
              </p>

              <h3 style={styles.cardTitle}>
                Have an empty seat?
              </h3>

              <p style={styles.cardText}>
                Publish your journey, share available seats, and help
                other travellers reach their destination.
              </p>

              <button
                onClick={() => {
                  setRole("driver");
                  setAuthMode("register");
                  setScreen("auth");
                }}
                style={{
                  ...styles.secondaryButton,
                  background: "#16845b",
                }}
              >
                Share My Journey →
              </button>

              <p style={{
                fontSize: "12px",
                color: "#8996a8",
                textAlign: "center",
              }}>
                Turn your empty seats into shared journeys.
              </p>
            </article>
          </section>

          {/* HOW IT WORKS */}
          <section style={{
            maxWidth: "1000px",
            margin: "55px auto",
            padding: "0 20px",
          }}>
            <h2 style={{
              textAlign: "center",
              fontSize: "28px",
              color: "#173b70",
            }}>
              Travel together in three simple steps
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "20px",
              marginTop: "28px",
            }}>
              {[
                ["01", "Choose your role", "Join as a passenger or driver."],
                ["02", "Connect your journey", "Find a ride or publish your route."],
                ["03", "Travel together", "Coordinate your trip and reach your destination."],
              ].map((item) => (
                <div
                  key={item[0]}
                  style={{
                    background: "white",
                    borderRadius: "14px",
                    padding: "22px",
                    border: "1px solid #e6edf6",
                  }}
                >
                  <div style={{
                    color: "#1764c0",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}>
                    STEP {item[0]}
                  </div>

                  <h3 style={{ color: "#173b70" }}>{item[1]}</h3>

                  <p style={{
                    color: "#65758b",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}>
                    {item[2]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <footer style={{
            textAlign: "center",
            padding: "25px 15px",
            borderTop: "1px solid #e1e8f1",
            color: "#718096",
            fontSize: "13px",
          }}>
            © {new Date().getFullYear()} Journey Share · Travel together.
          </footer>
        </>
      )}

      {/* AUTHENTICATION */}
      {!user && screen === "auth" && (
        <section style={{
          maxWidth: "520px",
          margin: "25px auto 60px",
          padding: "25px",
          background: "white",
          borderRadius: "18px",
          boxShadow: "0 8px 30px rgba(24,55,95,0.08)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "42px" }}>
              {role === "driver" ? "🚙" : "🧍‍♂️"}
            </div>

            <h2 style={{ color: "#173b70" }}>
              {role === "driver"
                ? "Join as a Driver"
                : "Join as a Passenger"}
            </h2>

            <p style={{ color: "#718096", fontSize: "14px" }}>
              Create your account or log in to continue.
            </p>
          </div>

          <AuthForm
            authMode={authMode}
            setAuthMode={setAuthMode}
            authForm={authForm}
            setAuthForm={setAuthForm}
            role={role}
            onSubmit={handleAuth}
            message={authMessage}
            loading={authLoading}
          />
        </section>
      )}

      {/* DRIVER DASHBOARD */}
      {user && user.role === "driver" && (
        <div style={{
          maxWidth: "1000px",
          margin: "20px auto 50px",
          padding: "0 20px",
        }}>
          <DriverDashboard
            journeys={journeys}
            onDelete={handleDeleteJourney}
            journeyForm={journeyForm}
            setJourneyForm={setJourneyForm}
            onPublish={handleJourneySubmit}
            driverRequests={driverRequests}
            onAction={handleRequestAction}
            loading={journeyLoading}
            actionLoading={actionLoading}
            message={
              journeyMessage || driverRequestMessage
            }
          />
        </div>
      )}

      {/* PASSENGER DASHBOARD */}
      {user && user.role === "passenger" && (
        <div style={{
          maxWidth: "1000px",
          margin: "20px auto 50px",
          padding: "0 20px",
        }}>
          <PassengerDashboard
            journeys={journeys}
            onRequest={openRequest}
          />
        </div>
      )}

      {/* SEAT REQUEST POPUP */}
      <RequestPopup
        journey={selectedJourney}
        requestForm={requestForm}
        setRequestForm={setRequestForm}
        onSubmit={handleRequestSubmit}
        onClose={() => setSelectedJourney(null)}
        loading={requestLoading}
        message={requestMessage}
      />

      {/* PASSENGER'S ONE-TIME SHARED LOCATION */}
         {mySharedLocation && (
        <div style={{
          maxWidth: "600px",
          margin: "15px auto",
          padding: "15px",
          background: "white",
          border: "1px solid #ddd",
          borderRadius: "10px",
        }}>
          <h3>Your Shared GPS Location</h3>

          <p>Your location was attached to your seat request.</p>

          <a
            href={`https://www.google.com/maps?q=${mySharedLocation.latitude},${mySharedLocation.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "blue", fontWeight: "bold" }}
          >
            View My Location on Google Maps
          </a>
        </div>
      )}
    </main>
  );
}
