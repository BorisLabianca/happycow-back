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
    const { username, email, location, password } = req.body;

    // Vérification de la présence des informations dans le body
    if (!username || !email || !location || !password) {
      return res.status(400).json({ message: "Missing parameters." });
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "The password must be at least 8 characters long." });
    }

    // Vérification de si l'adresse e-mail envoyée est déjà utilisée ou non
    const emailAlreadyUsed = await User.findOne({ email: email });
    if (emailAlreadyUsed) {
      return res
        .status(409)
        .json({ message: "This email address is already used." });
    }

    // Vérification de si le nom d'utilisateur est déjà utilisé ou non
    const usernameAlreadyUsed = await User.findOne({ username: username });
    if (usernameAlreadyUsed) {
      return res
        .status(409)
        .json({ message: "This username is already used." });
    }

    // Création du salt, du hash et du token
    const salt = uid2(16);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(64);

    // Création du nouvel utilisateur
    const newUser = new User({
      username: username,
      email: email,
      location: location,
      token: token,
      salt: salt,
      hash: hash,
    });

    await newUser.save();

    res.status(200).json({
      _id: newUser._id,
      token: token,
      username: username,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérification de la présence des informations nécessaires
    if (!email || !password) {
      return res.status(400).json({ message: "Missing parameters." });
    }

    // Vérification de l'existence de l'utilisateur
    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      return res.status(401).json({ message: "Unauthotized." });
    }

    // Vérification du hash
    const newHash = SHA256(password + userExists.salt).toString(encBase64);
    if (newHash !== userExists.hash) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    res.status(200).json({
      _id: userExists._id,
      username: userExists.username,
      avatar: userExists.avatar,
      token: userExists.token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
