const mongoose = require("mongoose");
const Favorite = mongoose.model("Favorite", {
  placeId: String,
  name: String,
  address: String,
  location: Object,
  phone: String,
  thumbnail: String,
  type: String,
  category: Number,
  rating: Number,
  vegan: Number,
  vegOnly: Number,
  price: String,
  owner: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});
module.exports = Favorite;
