const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, "public")));

function broadcastUserCount() {
  const message = JSON.stringify({
    type: "userCount",
    count: wss.clients.size
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  broadcastUserCount();

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    if (data.type === "chat") {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      const payload = {
        type: "chat",
        username: data.username,
        message: data.message,
        image: data.image || null,
        time
      };

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload));
        }
      });
    }
  });

  ws.on("close", () => {
    broadcastUserCount();
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});