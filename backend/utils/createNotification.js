const Notification = require("../models/Notification");

async function createNotification({ user, sender, postId, type, message }) {
  try {
    await Notification.create({
    user,
    sender,
    postId,
    type,
    message,
    isRead: false,
    createdAt: new Date(),
    });
  } catch (err) {
    console.log("❌ Notification Create Error:", err.message);
  }
}

module.exports = createNotification;
