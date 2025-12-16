const mongoose = require("mongoose");

const lostAndFoundSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  // old single image kept
  image: { type: String },

  // NEW: multiple images + videos
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },

  status: {
    type: String,
    enum: ["lost", "found", "claimed"],
    default: "lost"
  },

  hidden: { type: Boolean, default: false },

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("LostAndFound", lostAndFoundSchema);
