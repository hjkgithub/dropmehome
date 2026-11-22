
"use client";

import { useState } from "react";

export default function RequestPopup({
  journey,
  requestForm,
  setRequestForm,
  onSubmit,
  onClose,
  loading,
  message,
}) {
  const [shareLocation, setShareLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  if (!journey) return null;

  async function handleSubmit() {
    let passengerLocation = null;

    if (shareLocation) {
      if (!navigator.geolocation) {
        setLocationError("Location is not supported by your device.");
        return;
      }

      setLocationLoading(true);
      setLocationError("");

      try {
        passengerLocation = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            () => reject(new Error("Unable to get your location.")),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      } catch (error) {
        setLocationError(error.message);
        setLocationLoading(false);
        return;
      }

      setLocationLoading(false);
    }

    onSubmit(passengerLocation);
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerIcon}>🚘</div>
            <h2 style={styles.title}>Request a Seat</h2>
            <p style={styles.subtitle}>
              Complete your details to join this journey.
            </p>
          </div>

          <button onClick={onClose} style={styles.closeButton}>
            ✕
          </button>
        </div>

        {/* JOURNEY DETAILS */}
        <div style={styles.journeyCard}>
          <h3 style={styles.sectionTitle}>Journey Details</h3>

          <div style={styles.route}>
            <div style={styles.routeIcon}>📍</div>
            <div>
              <small style={styles.label}>FROM</small>
              <strong>{journey.fromLocation}</strong>
            </div>
          </div>

          <div style={styles.route}>
            <div style={styles.routeIcon}>🏁</div>
            <div>
              <small style={styles.label}>DESTINATION</small>
              <strong>{journey.destination}</strong>
            </div>
          </div>

          <div style={styles.seatInfo}>
            <span>🚗 {journey.vehicle}</span>
            <span>
              💺 {journey.seatsAvailable} seats available
            </span>
          </div>
        </div>

        {/* PASSENGER FORM */}
        <div style={styles.form}>
          <h3 style={styles.sectionTitle}>
            Passenger Information
          </h3>

          <label style={styles.inputLabel}>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={requestForm.name}
            onChange={(e) =>
              setRequestForm({
                ...requestForm,
                name: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.inputLabel}>Mobile Number</label>
          <input
            type="tel"
            placeholder="Enter your mobile number"
            value={requestForm.phone}
            onChange={(e) =>
              setRequestForm({
                ...requestForm,
                phone: e.target.value,
              })
            }
            style={styles.input}
          />

          <label style={styles.inputLabel}>Number of Seats</label>
          <select
            value={requestForm.seatsRequested}
            onChange={(e) =>
              setRequestForm({
                ...requestForm,
                seatsRequested: e.target.value,
              })
            }
            style={styles.input}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <option key={number} value={String(number)}>
                {number} {number === 1 ? "Seat" : "Seats"}
              </option>
            ))}
          </select>

          {/* LOCATION OPTION */}
          <div style={styles.locationCard}>
            <label style={styles.locationLabel}>
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => {
                  setShareLocation(e.target.checked);
                  setLocationError("");
                }}
              />
              <span>📍 Share my current location</span>
            </label>

            <p style={styles.locationHint}>
              Optional. Your location will be shared with the rider
              along with your seat request.
            </p>

            {locationError && (
              <p style={styles.error}>{locationError}</p>
            )}
          </div>

          {/* MESSAGE */}
          {message && (
            <div style={styles.message}>
              {message}
            </div>
          )}

          {/* BUTTONS */}
          <button
            onClick={handleSubmit}
            disabled={loading || locationLoading}
            style={{
              ...styles.submitButton,
              opacity: loading || locationLoading ? 0.6 : 1,
            }}
          >
            {locationLoading
              ? "Getting Location..."
              : loading
              ? "Submitting..."
              : "Confirm Seat Request →"}
          </button>

          <button
            onClick={onClose}
            style={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(10, 25, 45, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "15px",
    zIndex: 1000,
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  header: {
    background: "linear-gradient(135deg, #12365f, #1764a5)",
    color: "white",
    padding: "25px 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#dcecff",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  closeButton: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "none",
    borderRadius: "50%",
    width: "34px",
    height: "34px",
    fontSize: "17px",
    cursor: "pointer",
  },
  journeyCard: {
    margin: "18px",
    padding: "17px",
    background: "#f2f7fc",
    border: "1px solid #e0eaf5",
    borderRadius: "14px",
  },
  sectionTitle: {
    margin: "0 0 16px",
    color: "#173b70",
    fontSize: "17px",
  },
  route: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    marginBottom: "14px",
  },
  routeIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "white",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  label: {
    display: "block",
    color: "#8291a5",
    fontSize: "10px",
    marginBottom: "4px",
    letterSpacing: "1px",
  },
  seatInfo: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    borderTop: "1px solid #dce6f1",
    paddingTop: "12px",
    marginTop: "5px",
    fontSize: "12px",
    color: "#1764a5",
    fontWeight: "bold",
  },
  form: {
    padding: "5px 20px 22px",
  },
  inputLabel: {
    display: "block",
    marginBottom: "7px",
    marginTop: "14px",
    color: "#344966",
    fontSize: "13px",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px",
    border: "1px solid #d8e2ee",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    background: "#fbfdff",
    color: "#173b70",
  },
  locationCard: {
    marginTop: "18px",
    padding: "14px",
    background: "#f0f8f5",
    border: "1px solid #d4ebdf",
    borderRadius: "12px",
  },
  locationLabel: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    color: "#176b4c",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  locationHint: {
    margin: "8px 0 0 25px",
    color: "#647b70",
    fontSize: "12px",
    lineHeight: "1.5",
  },
  error: {
    color: "#c0392b",
    fontSize: "12px",
    marginBottom: 0,
  },
  message: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "9px",
    background: "#eef5ff",
    color: "#1764a5",
    fontSize: "13px",
  },
  submitButton: {
    width: "100%",
    marginTop: "20px",
    padding: "15px",
    background: "linear-gradient(135deg, #1764c0, #13845b)",
    color: "white",
    border: "none",
    borderRadius: "11px",
    fontSize: "15px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelButton: {
    width: "100%",
    marginTop: "9px",
    padding: "12px",
    background: "white",
    color: "#64748b",
    border: "1px solid #d8e2ee",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
          
