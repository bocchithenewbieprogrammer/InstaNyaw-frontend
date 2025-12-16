// backend/models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // receiver
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who triggered it
    message: { type: String, required: true }, // e.g. "liked your post"
    postId: { type: mongoose.Schema.Types.ObjectId, refPath: "postType" }, // optional
    postType: { type: String }, // "homepost" | "birthday" | "announcement" | ...
    postPreview: { type: String, default: "" }, // small text preview
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
