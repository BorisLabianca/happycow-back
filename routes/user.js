// Import des dépendances
const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;

// Import des modèles
const User = require("../models/User");

// Fonction pour encoder les fichiers image
const convertToBase64 = require("../functions/convertTobase64");

router.post("/user/signup", async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
