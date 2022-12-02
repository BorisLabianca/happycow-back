const mongoose = require("mongoose");
const User = mongoose.model("User", {
  username: String,
  email: String,
  location: String,
  avatar: Object,
  token: String,
  salt: String,
  hash: String,
  shops: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
  ],
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Favorite",
    },
  ],
});

module.exports = User;
