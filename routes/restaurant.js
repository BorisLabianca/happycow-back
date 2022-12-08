// Import des dépendances
const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

// Import des modèles
const Restaurant = require("../models/Restaurant");
const Review = require("../models/Review");
const User = require("../models/User");

// Import des middlewares
const isAuthenticated = require("../middleware/isAuthenticated");

// Fonction pour encoder les fichiers image
const convertToBase64 = require("../functions/convertTobase64");

router.post("/add", async (req, res) => {
  try {
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post(
  "/shop/add-review",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      // console.log(req.body);
      const { title, review, rating, pros, cons, placeId } = req.body;
      // console.log(req.files);
      const shopToReview = await Restaurant.findById(placeId);
      const reviewer = await User.findById(req.user._id).select(
        "-hash -salt -email -token"
      );
      console.log(shopToReview);
      if (!title || !review || !rating || !placeId) {
        return res.status(400).json({ message: "Missing parameters." });
      }

      const newReview = new Review({
        title: title,
        review: review,
        rating: rating,
        shop: placeId,
        owner: reviewer,
      });

      if (pros) {
        newReview.pros = pros;
      }
      if (cons) {
        newReview.cons = cons;
      }
      if (req?.files?.photos && req?.files?.photos.length !== 0) {
        const arrayOfPhotosUrl = [];
        if (req.files.photos.length === 1) {
          let result = await cloudinary.uploader.upload(
            convertToBase64(req.files.photos),
            {
              folder: `/happycow/shop/${placeId}`,
            }
          );
          // console.log(result);
          arrayOfPhotosUrl.push(result.secure_url);
          shopToReview.pictures.push(result.secure_url);
        } else if (req.files.photos.length > 1) {
          for (let i = 0; i < req.files.photos.length; i++) {
            let result = await cloudinary.uploader.upload(
              convertToBase64(req.files.photos[i]),
              {
                folder: `/happycow/shop/${placeId}`,
              }
            );
            // console.log(req.files.photos[1]);
            arrayOfPhotosUrl.push(result.secure_url);
            shopToReview.pictures.push(result.secure_url);
          }
        }

        newReview.photos = arrayOfPhotosUrl;
        // console.log(arrayOfPhotosUrl);
      }
      reviewer.reviews.push(newReview);
      shopToReview.reviews.push(newReview);
      await newReview.save();
      await reviewer.save();
      await shopToReview.save();

      res.status(200).json({ newReview, reviewer, shopToReview });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

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
    if (!req.query.skip) {
      skip = 0;
    } else {
      skip = Number(req.query.skip);
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
