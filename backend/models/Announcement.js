const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },

  // NEW media support
  images: { type: [String], default: [] },
  videos: { type: [String], default: [] },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  hidden: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", announcementSchema);
