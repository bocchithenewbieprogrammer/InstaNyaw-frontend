const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, required: true },
postType: { type: String, required: true , 
    enum: ["homepost", "birthday", "announcement", "news", "lostfound"], 
    required: true 
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Like", likeSchema);
