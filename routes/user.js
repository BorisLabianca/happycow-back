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
const Favorite = require("../models/Favorite");

// Import des middlewares
const isAuthenticated = require("../middleware/isAuthenticated");

// Fonction pour encoder les fichiers image
const convertToBase64 = require("../functions/convertTobase64");

router.post("/user/signup", async (req, res) => {
  try {
    const { username, email, location, preferences, password } = req.body;

    // Vérification de la présence des informations dans le body
    if (!username || !email || !location || !preferences || !password) {
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
      preferences: preferences,
      token: token,
      salt: salt,
      hash: hash,
    });

    await newUser.save();

    res.status(200).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      location: newUser.location,
      preferences: newUser.preferences,
      // avatar: newUser.avatar.secure_url,
      token: token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(Object.keys(req));

    // Vérification de la présence des informations nécessaires
    if (!email || !password) {
      return res.status(400).json({ message: "Missing parameters." });
    }

    // Vérification de l'existence de l'utilisateur
    const userExists = await User.findOne({ email: email });
    if (!userExists) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    // Vérification du hash
    const newHash = SHA256(password + userExists.salt).toString(encBase64);
    if (newHash !== userExists.hash) {
      return res.status(401).json({ message: "Unauthorized." });
    }
    let avatar;
    if (userExists.avatar) {
      avatar = userExists.avatar.secure_url;
    } else {
      avatar = null;
    }
    res.status(200).json({
      _id: userExists._id,
      username: userExists.username,
      email: userExists.email,
      location: userExists.location,
      preferences: userExists.preferences,
      avatar: avatar,
      token: userExists.token,
      shops: userExists.shops,
      favorites: userExists.favorites,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/addfavorite", isAuthenticated, async (req, res) => {
  // console.log(req.body.placeId);
  try {
    const {
      placeId,
      name,
      address,
      location,
      phone,
      thumbnail,
      type,
      category,
      rating,
      vegan,
      vegOnly,
      price,
      owner,
    } = req.body;
    const newFavorite = new Favorite({
      placeId: placeId,
      name: name,
      address: address,
      location: location,
      phone: phone,
      thumbnail: thumbnail,
      type: type,
      category: category,
      rating: rating,
      vegan: vegan,
      vegOnly: vegOnly,
      price: price,
      owner: owner,
    });
    // console.log(newFavorite);
    const user = await User.findById(owner);
    user.favorites.push(newFavorite.placeId);
    await newFavorite.save();
    await user.save();
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      location: user.location,
      token: user.token,
      shops: user.shops,
      favorites: user.favorites,
      avatar: user?.avatar ? user.avatar.secure_url : null,
    };
    res.status(200).json({ newFavorite, userData });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/user/profile/:id", isAuthenticated, async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ message: "The user id is missing." });
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }
    let avatar;
    if (user.avatar) {
      avatar = user.avatar.secure_url;
    } else {
      avatar = null;
    }
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      location: user.location,
      preferences: user.preferences,
      avatar: avatar,
      token: user.token,
      shops: user.shops,
      favorites: user.favorites,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/user/favorites", isAuthenticated, async (req, res) => {
  try {
    // console.log(req.user);
    const favorites = await Favorite.find({ owner: req.user._id });
    // console.log(favorites);
    res.status(200).json(favorites);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/user/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    // console.log(req.body);
    const userEmailAlreadyUsed = await User.findOne({ email: req.body.email });
    const usernameAlreadyUsed = await User.findOne({
      username: req.body.username,
    });

    if (usernameAlreadyUsed && req.user.username !== req.body.username) {
      return res
        .status(409)
        .json({ message: "This username is already used." });
    }
    if (userEmailAlreadyUsed && req.user.email !== req.body.email) {
      return res
        .status(409)
        .json({ message: "This email address is already used." });
    }

    if (
      req.body.username ||
      req.body.email ||
      req.body.location ||
      req.body.preferences ||
      req?.files?.avatar
    ) {
      const userToUpdate = await User.findById(req.user._id);
      if (req.body.username) {
        if (req.body.username !== userToUpdate.username) {
          userToUpdate.username = req.body.username;
        }
      }
      if (req.body.email) {
        if (req.body.email !== userToUpdate.email) {
          userToUpdate.email = req.body.email;
        }
      }
      if (req.body.location) {
        if (req.body.location !== userToUpdate.location) {
          userToUpdate.location = req.body.location;
        }
      }
      if (req.body.preferences) {
        if (req.body.preferences !== userToUpdate.preferences) {
          userToUpdate.preferences = req.body.preferences;
        }
      }

      if (req.files?.avatar) {
        if (!userToUpdate.avatar) {
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.avatar),
            {
              folder: `/happycow/user/${userToUpdate._id}`,
            }
          );
          userToUpdate.avatar = result;
          // console.log(result);
        } else {
          await cloudinary.uploader.destroy(userToUpdate.avatar.public_id);
          const result = await cloudinary.uploader.upload(
            convertToBase64(req.files.avatar),
            {
              folder: `/happycow/user/${userToUpdate._id}`,
            }
          );
          userToUpdate.avatar = result;
        }
      }

      await userToUpdate.save();
      let avatar;
      if (userToUpdate.avatar) {
        avatar = userToUpdate.avatar.secure_url;
      } else {
        avatar = null;
      }
      res.status(200).json({
        _id: userToUpdate._id,
        username: userToUpdate.username,
        email: userToUpdate.email,
        location: userToUpdate.location,
        preferences: userToUpdate.preferences,
        avatar: avatar,
        token: userToUpdate.token,
        shops: userToUpdate.shops,
        favorites: userToUpdate.favorites,
      });
    } else {
      res.status(400).json({ message: "Missing informations." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/user/delete-favorite", isAuthenticated, async (req, res) => {
  try {
    console.log(req.body);
    await Favorite.deleteOne({ placeId: req.body.placeId });
    const userToDeleteFrom = await User.findById(req.body.userId);

    const indexOfDeletion = userToDeleteFrom.favorites.indexOf(
      req.body.placeId
    );
    userToDeleteFrom.favorites.splice(indexOfDeletion, 1);
    console.log(userToDeleteFrom);

    await userToDeleteFrom.save();
    res.status(200).json({
      _id: userToDeleteFrom._id,
      username: userToDeleteFrom.username,
      email: userToDeleteFrom.email,
      location: userToDeleteFrom.location,
      preferences: userToDeleteFrom.preferences,
      avatar: userToDeleteFrom.avatar
        ? userToDeleteFrom.avatar.secure_url
        : null,
      token: userToDeleteFrom.token,
      shops: userToDeleteFrom.shops,
      favorites: userToDeleteFrom.favorites,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
