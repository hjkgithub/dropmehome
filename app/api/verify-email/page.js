
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [message, setMessage] = useState("Verifying your email...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setMessage("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "/api/email-verification/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
          }
        );

        const data = await response.json();

        setMessage(
          response.ok
            ? data.message || "Email verified successfully!"
            : data.error || "Email verification failed."
        );
      } catch {
        setMessage("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#f3f4f6",
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        padding: "35px",
        borderRadius: "15px",
        textAlign: "center",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 5px 20px rgba(0,0,0,0.08)"
      }}>
        <h1>Journey Share</h1>

        <h2>Email Verification</h2>

        <p>{message}</p>

        {loading && <p>Please wait...</p>}

        {!loading && (
          <a href="/"
             style={{
               display: "inline-block",
               marginTop: "20px",
               padding: "12px 24px",
               background: "#2563eb",
               color: "white",
               textDecoration: "none",
               borderRadius: "8px"
             }}>
            Go to Home
          </a>
        )}
      </div>
    </main>
  );
}

