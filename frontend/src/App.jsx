import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

// Connect to Node.js Backend
const socket = io("http://localhost:3000");

function App() {
  const [alerts, setAlerts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [parkingData, setParkingData] = useState({
    total_available: 50,
    left_available: 25,
    right_available: 25
  });

  const audioRef = useRef(new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg"));

  useEffect(() => {
    // Listen for real-time parking updates
    socket.on("parking_update", (data) => {
      setParkingData(data);
    });

    // Listen for SOS alerts
    socket.on("sos_alert", (data) => {
      setAlerts((prev) => {
        if (prev.find((a) => a.room === data.room)) return prev;
        return [data, ...prev];
      });
      if (soundEnabled) {
        audioRef.current.play().catch(() => {});
      }
    });

    return () => {
      socket.off("parking_update");
      socket.off("sos_alert");
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
    <div style={containerStyle}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>Smart Building Management</h1>
        <p style={{ color: '#7f8c8d' }}>Real-time Parking & Security Monitor</p>
      </header>

      {/* --- PARKING SECTION --- */}
      <section style={sectionStyle}>
        <h2 style={{ color: '#34495e', borderLeft: '5px solid #3498db', paddingLeft: '10px' }}>🚗 Parking Occupancy</h2>
        <div style={gridStyle}>
          <div style={cardStyle("#3498db")}>
            <span style={labelStyle}>TOTAL AVAILABLE</span>
            <div style={valStyle}>{parkingData.total_available}</div>
          </div>
          <div style={cardStyle("#2ecc71")}>
            <span style={labelStyle}>LEFT SECTION</span>
            <div style={valStyle}>{parkingData.left_available} <small style={{fontSize: '14px', color: '#999'}}>/ 25</small></div>
          </div>
          <div style={cardStyle("#e67e22")}>
            <span style={labelStyle}>RIGHT SECTION</span>
            <div style={valStyle}>{parkingData.right_available} <small style={{fontSize: '14px', color: '#999'}}>/ 25</small></div>
          </div>
        </div>
      </section>

      {/* --- SOS SECTION --- */}
      <section style={{ ...sectionStyle, marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ color: '#c0392b', borderLeft: '5px solid #c0392b', paddingLeft: '10px' }}>🚨 Active SOS Alerts</h2>
          {!soundEnabled && (
            <button onClick={enableSound} style={soundBtnStyle}>Enable Alert Sound</button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div style={emptyBox}>All systems clear. No active alerts.</div>
        ) : (
          alerts.map((a, i) => (
            <div key={i} style={sosCard}>
              <div>
                <strong style={{ fontSize: '18px' }}>EMERGENCY IN ROOM {a.room}</strong>
                <p style={{ margin: '5px 0 0', color: '#666' }}>Building: {a.building || "Main"}</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleAction(a, "APPROVE", i)} style={actionBtn("#27ae60")}>ACKNOWLEDGE</button>
                <button onClick={() => handleAction(a, "STOP", i)} style={actionBtn("#c0392b")}>DISMISS</button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#fdfdfd', minHeight: '100vh' };
const sectionStyle = { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };
const gridStyle = { display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' };
const cardStyle = (clr) => ({ flex: 1, minWidth: '200px', padding: '25px', borderRadius: '12px', borderBottom: `6px solid ${clr}`, backgroundColor: '#f8f9fa', textAlign: 'center' });
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#95a5a6', letterSpacing: '1px' };
const valStyle = { fontSize: '48px', fontWeight: '800', color: '#2c3e50', marginTop: '5px' };
const emptyBox = { padding: '40px', textAlign: 'center', color: '#bdc3c7', border: '2px dashed #ecf0f1', borderRadius: '10px', marginTop: '20px' };
const sosCard = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: '#fff5f5', border: '1px solid #feb2b2', borderRadius: '10px', marginTop: '15px' };
const actionBtn = (bg) => ({ backgroundColor: bg, color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' });
const soundBtnStyle = { backgroundColor: '#34495e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px' };

export default App;