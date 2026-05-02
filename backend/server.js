const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 3000;

// ================= MQTT CONNECTION (HiveMQ) =================
const client = mqtt.connect(
  "mqtts://c7e8cba740bd45a0b79454529cda6758.s1.eu.hivemq.cloud:8883",
  {
    username: "smartSOS",
    password: "Password123",
    reconnectPeriod: 3000,
  }
);

client.on("connect", () => {
  console.log("✅ Connected to HiveMQ Cloud");
  client.subscribe("sos/alert");
  client.subscribe("parking/status"); // Matches your latest ESP32 code
});

client.on("message", (topic, message) => {
  try {
    const rawData = JSON.parse(message.toString());

    if (topic === "sos/alert") {
      console.log("🚨 SOS Alert:", rawData);
      io.emit("sos_alert", rawData);
    } 
    
    if (topic === "parking/status") {
      console.log("🚗 ESP32 Update:", rawData);

      // TRANSLATION: Map {left, right} to what the React UI needs
      const dashboardUpdate = {
        total_available: (rawData.left || 0) + (rawData.right || 0),
        left_available: rawData.left || 0,
        right_available: rawData.right || 0
      };

      io.emit("parking_update", dashboardUpdate);
    }
  } catch (e) {
    console.log("❌ Error parsing message:", e.message);
  }
});

// ================= SOCKET.IO CLIENT LOGIC =================
io.on("connection", (socket) => {
  console.log("🟢 Admin Dashboard Connected");

  socket.on("sos_control", (data) => {
    // Send control commands back to ESP32 if needed
    client.publish("sos/control", JSON.stringify(data));
  });
});

server.listen(PORT, () => {
  console.log(`🚀 System running at http://localhost:${PORT}`);
});