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

router.post("/add", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const {
      name,
      address,
      lng,
      lat,
      phone,
      type,
      category,
      rating,
      description,
      price,
      website,
      facebook,
    } = req.body;

    // Vérification de la présence des informations dans le body
    // console.log(req.body.lat);
    // console.log(req.user);
    if (
      !name ||
      !address ||
      !lng ||
      !lat ||
      !phone ||
      !type ||
      !category ||
      !rating ||
      !description ||
      !price
    ) {
      return res.status(400).json({ message: "Missing parameters." });
    }

    // Vérification de l'existence du restaurant dans la base de données
    const shopExists = await Restaurant.findOne({ name: name });
    if (shopExists) {
      return res
        .status(409)
        .json({ message: "This place has already been added." });
    }
    // const parsedLocation = JSON.parse(location);
    // console.log(parsedLocation);
    const nearbyPlaces = await Restaurant.find({
      location: {
        $near: [Number(lng), Number(lat)],
        $maxDistance: 0.003,
      },
    }).select("placeId -_id");

    const newRestaurant = new Restaurant({
      name: name,
      address: address,
      phone: phone,
      type: type,
      category: category,
      rating: rating,
      description: description,
      price: price,
      owner: req.user._id,
    });
    newRestaurant.location = { lng: Number(lng), lat: Number(lat) };
    newRestaurant.placeId = newRestaurant._id;
    const nearbyPlacesIds = [];
    for (let i = 0; i < nearbyPlaces.length; i++) {
      if (nearbyPlaces.length > 5 && i < 5) {
        nearbyPlacesIds.push(nearbyPlaces[i].placeId);
      } else if (nearbyPlaces.length > 0 && nearbyPlaces.length <= 5) {
        nearbyPlacesIds.push(nearbyPlaces[i].placeId);
      }
    }
    newRestaurant.nearbyPlacesIds = nearbyPlacesIds;
    if (facebook) {
      newRestaurant.facebook = facebook;
    }
    if (website) {
      newRestaurant.website = website;
    }
    newRestaurant.link = `https://boris-labianca-happycow.netlify.app/shop/${newRestaurant._id}`;
    if (req.files.pictures) {
      const arrayOfpicturesUrl = [];
      if (req.files.pictures.length === undefined) {
        let result = await cloudinary.uploader.upload(
          convertToBase64(req.files.pictures),
          {
            folder: `/happycow/shop/${newRestaurant._id}`,
          }
        );
        // console.log(result);
        // arrayOfpicturesUrl.push(result.secure_url);
        newRestaurant.thumbnail = result.secure_url;
      } else if (req.files.pictures.length > 1) {
        for (let i = 0; i < req.files.pictures.length; i++) {
          if (i === 0) {
            let result = await cloudinary.uploader.upload(
              convertToBase64(req.files.pictures[i]),
              {
                folder: `/happycow/shop/${newRestaurant._id}`,
              }
            );
            newRestaurant.thumbnail = result.secure_url;
          } else {
            let result = await cloudinary.uploader.upload(
              convertToBase64(req.files.pictures[i]),
              {
                folder: `/happycow/shop/${newRestaurant._id}`,
              }
            );
            // console.log(req.files.pictures[1]);
            arrayOfpicturesUrl.push(result.secure_url);
            newRestaurant.pictures.push(result.secure_url);
          }
        }
      }
    }
    // console.log(newRestaurant);
    await newRestaurant.save();
    res.json(newRestaurant);
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
      // console.log(req.files.length);
      const { title, review, rating, pros, cons, placeId } = req.body;
      // console.log(req.files);
      const shopToReview = await Restaurant.findById(placeId);
      const reviewer = await User.findById(req.user._id).select(
        "-hash -salt -email -token"
      );
      // console.log(reviewer);
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
      if (req?.files?.photos) {
        const arrayOfPhotosUrl = [];
        if (req.files.photos.length === undefined) {
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
      const newDate = new Date();
      const options = { month: "short" };
      const reviewDate = `${newDate.getDate()} ${Intl.DateTimeFormat(
        "fr-FR",
        options
      ).format(newDate)} ${newDate.getFullYear()}`;

      // console.log(shopToReview);
      reviewer.reviews.push(newReview);
      shopToReview.reviews.push(newReview);
      newReview.date = reviewDate;
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
    const reviews = await Review.find({ shop: req.params.id }).populate(
      "owner"
    );
    // console.log("reviews:", reviews);
    res.status(200).json({ shop, reviews });
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
