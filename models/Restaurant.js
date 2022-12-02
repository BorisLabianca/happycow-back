const mongoose = require("mongoose");
const Restaurant = mongoose.model("Restaurant", {
  placeId: Number,
  name: String,
  address: String,
  location: {
    lng: Number,
    lat: Number,
  },
  phone: String,
  thumbnail: String,
  type: String,
  category: Number,
  rating: Number,
  vegan: Number,
  vegOnly: Number,
  link: String,
  description: String,
  pictures: Array,
  price: String,
  website: String,
  facebook: String,
  nearbyPlacesIds: Array,
  owner: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

module.exports = Restaurant;
