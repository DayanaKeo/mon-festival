// scripts/reminders-dev.js
import http, { IncomingMessage } from "http";
const url = process.env.CRON_URL || "http://localhost:3000/api/tasks/reminders";

function ping() {
  const req = http.get(url, (res: IncomingMessage) => {
    console.log(new Date().toISOString(), "cron", res.statusCode);
    res.resume(); // consomme la réponse
  });
  req.on("error", (e) => console.error("cron error:", e.message));
}

// 1er ping immédiat puis toutes les 60s
ping();
setInterval(ping, 60_000);
