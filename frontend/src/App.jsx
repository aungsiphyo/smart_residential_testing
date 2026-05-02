import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [alerts, setAlerts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  // Parking States
  const [parkingData, setParkingData] = useState({
    total_available: 50,
    left_available: 25,
    right_available: 25
  });

  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));

  useEffect(() => {
    // SOS Listener
    socket.on("sos_alert", (data) => {
      setAlerts((prev) =>
        prev.find((a) => a.room === data.room) ? prev : [data, ...prev]
      );
      if (soundEnabled) {
        audioRef.current.play().catch(() => {});
      }
    });

    // Parking Listener - Receives data directly from ESP32 via Backend
    socket.on("parking_update", (data) => {
      setParkingData(data);
    });

    return () => {
      socket.off("sos_alert");
      socket.off("parking_update");
    };
  }, [soundEnabled]);

  const handleAction = (alert, action, index) => {
    socket.emit("sos_control", { ...alert, action });
    setAlerts((prev) => prev.filter((_, i) => i !== index));
  };

  const enableSound = () => {
    audioRef.current.play().then(() => {
      audioRef.current.pause();
      setSoundEnabled(true);
    });
  };

  return (
    <div style={{ padding: 30, fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>🏢 Smart Building Control Panel</h1>

      {/* --- PARKING SECTION --- */}
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
        <div style={cardStyle("#3498db")}>
          <h3>Total Available</h3>
          <p style={countStyle}>{parkingData.total_available}</p>
        </div>
        <div style={cardStyle("#2ecc71")}>
          <h3>Left Section</h3>
          <p style={countStyle}>{parkingData.left_available} / 25</p>
        </div>
        <div style={cardStyle("#e67e22")}>
          <h3>Right Section</h3>
          <p style={countStyle}>{parkingData.right_available} / 25</p>
        </div>
      </div>

      <hr />

      {/* --- SOS SECTION --- */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#c0392b' }}>🚨 SOS Alerts</h2>
        {!soundEnabled && (
          <button onClick={enableSound} style={btnStyle("#95a5a6")}>Enable Sound</button>
        )}

        {alerts.length === 0 && <p style={{ color: '#7f8c8d' }}>No emergency alerts at this time.</p>}

        {alerts.map((a, i) => (
          <div key={i} style={sosBoxStyle}>
            <h3>EMERGENCY: Room {a.room || "Unknown"}</h3>
            <p>Building: {a.building || "Main"}</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleAction(a, "APPROVE", i)} style={btnStyle("#27ae60")}>APPROVE</button>
              <button onClick={() => handleAction(a, "STOP", i)} style={btnStyle("#c0392b")}>STOP</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Styles ---
const cardStyle = (color) => ({
  backgroundColor: '#fff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  textAlign: 'center',
  minWidth: '180px',
  borderTop: `8px solid ${color}`
});

const countStyle = { fontSize: '32px', fontWeight: 'bold', margin: '10px 0' };

const sosBoxStyle = {
  backgroundColor: '#fff',
  border: '2px solid #e74c3c',
  borderRadius: '10px',
  padding: '20px',
  marginTop: '15px',
  boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)'
};

const btnStyle = (color) => ({
  backgroundColor: color,
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
});

export default App;