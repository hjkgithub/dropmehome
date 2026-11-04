
"use client";

export default function AuthForm({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  role,
  onSubmit,
  message,
  loading,
}) {
  function updateField(field, value) {
    setAuthForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  return (
    <div>
      <h2>
        {authMode === "register" ? "Create Account" : "Login"}
      </h2>

      <p>
        Account type: <strong>{role}</strong>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {authMode === "register" && (
          <input
            type="text"
            placeholder="Your name"
            value={authForm.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={authForm.email}
          onChange={(e) =>
            updateField("email", e.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={authForm.password}
          onChange={(e) =>
            updateField("password", e.target.value)
          }
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : authMode === "register"
            ? "Register"
            : "Login"}
        </button>
      </form>

      {message && <p>{message}</p>}

      <button
        type="button"
        onClick={() =>
          setAuthMode(
            authMode === "register" ? "login" : "register"
          )
        }
      >
        {authMode === "register"
          ? "Already have an account? Login"
          : "Create a new account"}
      </button>
    </div>
  );
            }

