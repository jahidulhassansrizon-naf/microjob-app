const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dns = require("dns");
require("dotenv").config();

// নেটওয়ার্কের ডিএনএস প্রবলেম ফিক্স করার জন্য
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import Auth Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

// MongoDB Atlas Connection
mongoose
  .connect(
    "mongodb+srv://jahidulhassansrizon_db_user:lnEWgv35hkgUmM6m@cluster0.jyuqetm.mongodb.net/microjob?appName=Cluster0",
  )
  .then(() => console.log("MongoDB Connected Successfully!"))
  .catch((err) => console.log("DB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("Backend server is running smoothly!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
