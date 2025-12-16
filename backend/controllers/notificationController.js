// backend/controllers/notificationController.js
const Notification = require("../models/Notification");

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const items = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "username avatar");

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/mark-read
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// (Optional) helper to create a notification from other controllers
exports.createNotification = async ({
  userId,
  senderId,
  message,
  postId,
  postType,
  postPreview,
}) => {
  try {
    await Notification.create({
      user: userId,
      sender: senderId,
      message,
      postId,
      postType,
      postPreview: postPreview?.slice(0, 120) || "",
    });
  } catch (err) {
    console.error("❌ Failed to create notification:", err);
  }
};
