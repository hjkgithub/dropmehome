"use client";

import { useState, useEffect } from "react";

import RoleSelection from "./components/RoleSelection";
import AuthForm from "./components/AuthForm";
import DriverDashboard from "./components/DriverDashboard";
import PassengerDashboard from "./components/PassengerDashboard";
import RequestPopup from "./components/RequestPopup";

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
    return <main><h2>Loading...</h2></main>;
  }

  return (
    <main style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      <h1>Journey Share</h1>

      {user && (
        <div>
          <p>Welcome, {user.name}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}

      {!user && screen === "home" && (
        <RoleSelection
          onSelect={(selectedRole) => {
            setRole(selectedRole);
            setScreen("auth");
          }}
        />
      )}

      {!user && screen === "auth" && (
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
      )}

      {user && user.role === "driver" && (
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
          message={journeyMessage || driverRequestMessage}
        />
      )}

      {user && user.role === "passenger" && (
        <PassengerDashboard
          journeys={journeys}
          onRequest={openRequest}
        />
      )}

      <RequestPopup
        journey={selectedJourney}
        requestForm={requestForm}
        setRequestForm={setRequestForm}
        onSubmit={handleRequestSubmit}
        onClose={() => setSelectedJourney(null)}
        loading={requestLoading}
        message={requestMessage}
      />
    </main>
  );
      }
