
"use client";

import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function verifyEmail() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setMessage("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/verify-email?token=${encodeURIComponent(token)}`,
          { method: "GET", cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Verification failed.");
        }

        setSuccess(true);
        setMessage(data.message);
      } catch (error) {
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f3f4f6",
      padding: 20,
      fontFamily: "Arial"
    }}>
      <div style={{
        background: "white",
        padding: 35,
        borderRadius: 15,
        maxWidth: 420,
        width: "100%",
        textAlign: "center"
      }}>
        <h1>Journey Share</h1>
        <h2>Email Verification</h2>

        <p>{message}</p>

        {loading && <p>Please wait...</p>}

        {!loading && success && (
          <p style={{ color: "green" }}>
            Your account is verified!
          </p>
        )}

        {!loading && (
          <a href="/" style={{
            display: "inline-block",
            marginTop: 20,
            padding: "12px 24px",
            background: "#2563eb",
            color: "white",
            borderRadius: 8,
            textDecoration: "none"
          }}>
            Go to Login
          </a>
        )}
      </div>
    </main>
  );
}

