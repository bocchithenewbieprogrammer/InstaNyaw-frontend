const mongoose = require("mongoose");

const HomePostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  content: {
    type: String,
    required: true,
    trim: true,
  },

  image: {
    type: String,
    default: "",
  },

  images: {
    type: [String],
    default: [],
  },

  // FIXED: MUST BE ARRAY
  videos: {
    type: [String],
    default: [],
  },

  hidden: {
    type: Boolean,
    default: false,
  },

  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Like" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("HomePost", HomePostSchema);
