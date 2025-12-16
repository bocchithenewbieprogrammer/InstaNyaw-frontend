const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/authMiddleware");

// GET latest notifications
router.get("/", protect, async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "username avatar");
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: "Error loading notifications" });
  }
});

// GET unread count
router.get("/unread-count", protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error counting notifications" });
  }
});

// MARK ALL AS READ
router.post("/mark-all-read", protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error marking notifications" });
  }
});

module.exports = router;
