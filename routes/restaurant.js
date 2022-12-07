// Import des dépendances
const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

// Import des modèles
const Restaurant = require("../models/Restaurant");

// Fonction pour encoder les fichiers image
const convertToBase64 = require("../functions/convertTobase64");

router.post("/add", async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/allshops", async (req, res) => {
  try {
    // console.log(req.query);
    let filters = {};
    if (req.query.name) {
      filters.name = new RegExp(req.query.name, "gi");
    }
    if (req.query.category) {
      filters.category = req.query.category;
    }

    let sort = {};
    if (req.query.sort) {
      if (req.query.sort === "NameABC") {
        sort = { name: 1 };
      } else if (req.query.sort === "NameCBA") {
        sort = { name: -1 };
      } else if (req.query.sort === "RatingCBA") {
        sort = { rating: -1 };
      }
    } else {
      sort = null;
    }

    let limit;
    if (req.query.limit) {
      limit = Number(req.query.limit);
    }

    let skip = 0;
    if (!req.query.page) {
      skip = 0;
    } else {
      skip = (Number(req.query.page) - 1) * limit;
    }

    const allShops = await Restaurant.find(filters)
      .sort(sort)
      .collation({ locale: "en", caseLevel: true, strength: 1 })
      .skip(skip)
      .limit(limit);
    const shopsCount = await Restaurant.countDocuments(filters);
    res.status(200).json({ count: shopsCount, shops: allShops });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/shop/:id", async (req, res) => {
  try {
    if (!req.params) {
      return res.status(400).json({ message: error.message });
    }
    const shop = await Restaurant.findById(req.params.id);
    res.status(200).json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/near", async (req, res) => {
  try {
    if (!req.query) {
      return res.status(400).json({ message: error.message });
    }
    const shop = await Restaurant.findOne({ placeId: req.query.placeId });
    res.status(200).json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
