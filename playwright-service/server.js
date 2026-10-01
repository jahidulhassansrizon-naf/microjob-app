const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

// Basic CORS for now.
// Later we can restrict this to your Vercel domain.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "10mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    service: "microjob-playwright",
    status: "online",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Playwright service running on port ${PORT}`);
});
