const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["birthday", "announcement", "lost_found", "school_news", "campus_wall"], 
    required: true 
  },
  approved: { type: Boolean, default: false }, // Admin approves (except Campus Wall)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);
