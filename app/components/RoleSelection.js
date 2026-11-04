
"use client";

export default function RoleSelection({ onSelect }) {
  return (
    <div>
      <h2>Welcome to Journey Share</h2>
      <p>Choose how you want to use the application.</p>

      <button onClick={() => onSelect("passenger")}>
        I want to be dropped
      </button>

      <button onClick={() => onSelect("driver")}>
        I can drop people
      </button>
    </div>
  );
}

