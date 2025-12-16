const mongoose = require("mongoose");

const birthdayGreetingSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },

  // old single image kept
  image: { type: String, default: "" },

  // NEW
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },

  hidden: { type: Boolean, default: false },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("BirthdayGreeting", birthdayGreetingSchema);
