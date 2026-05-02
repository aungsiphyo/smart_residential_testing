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

// ================= MQTT CONNECTION =================
const client = mqtt.connect(
  "mqtts://c7e8cba740bd45a0b79454529cda6758.s1.eu.hivemq.cloud:8883",
  {
    username: "smartSOS",
    password: "Password123",
    reconnectPeriod: 3000,
  }
);

client.on("connect", () => {
  console.log("✅ MQTT Connected");
  client.subscribe("sos/alert");
  client.subscribe("carparking/status"); // Subscribed to updated topic
});

client.on("message", (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (topic === "sos/alert") {
      console.log("🚨 SOS Received:", data);
      io.emit("sos_alert", data);
    } 
    
    if (topic === "carparking/status") {
      console.log("🚗 Parking Update:", data);
      // Sends { total_available, left_available, right_available }
      io.emit("parking_update", data);
    }

  } catch (e) {
    console.log("Invalid message received");
  }
});

io.on("connection", (socket) => {
  console.log("🟢 Admin Connected");
  socket.on("sos_control", (data) => {
    client.publish("sos/control", JSON.stringify(data));
  });
});

server.listen(PORT, () => {
  console.log("🚀 Server running on http://localhost:" + PORT);
});