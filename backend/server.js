import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://your-netlify-app.netlify.app", // Replace with your actual Netlify URL
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tradingapp")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use('/auth', authRoutes);

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Trading API is running!" });
});

// Protected route example
app.get("/profile", async (req, res) => {
  // This would use the authenticateToken middleware in a real implementation
  res.json({ message: "This is a protected route" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});