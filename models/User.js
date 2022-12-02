const mongoose = require("mongoose");
const User = mongoose.model("User", {
  username: String,
  email: String,
  location: String,
  avatar: Object,
  token: String,
  salt: String,
  hash: String,
});

module.exports = User;
