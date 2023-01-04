// Import des dépendances
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Appel des modules
const app = express();
app.use(express.json());
app.use(cors());

// Paramètres Mongoose
mongoose.connect(process.env.MONGODB_URI);

// Paramètres de config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Import des routes
const restaurantRoutes = require("./routes/restaurant");
const userRoutes = require("./routes/user");
app.use(restaurantRoutes);
app.use(userRoutes);

app.all("*", (req, res) => {
  res.status(400).json({ message: "Cette page n'existe pas." });
});

app.listen(process.env.PORT, () => {
  console.log("The HappyCow server is live!!!! Moooooooo!!!!! 🐮🐮🐮");
});
