
"use client";

import { useEffect, useRef, useState } from "react";

export default function VisitorCounter() {
  const [visitorCount, setVisitorCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;

    counted.current = true;

    fetch("/api/visitors", {
      method: "POST",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.visitors !== undefined) {
          setVisitorCount(data.visitors);
        }
      })
      .catch((error) => {
        console.error("Visitor counter error:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px 20px",
      background: "#eff6ff",
      border: "1px solid #dbeafe",
      borderRadius: "30px",
      color: "#1e3a8a",
      fontWeight: "600",
      fontSize: "14px",
    }}>
      <span style={{ fontSize: "20px" }}>👥</span>
      <span>
        Total Visitors:{" "}
        {loading ? "Loading..." : visitorCount ?? "Unavailable"}
      </span>
    </div>
  );
}

