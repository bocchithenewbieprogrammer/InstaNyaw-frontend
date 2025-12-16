// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const { getNotifications, markAllAsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getNotifications);
router.put("/mark-read", protect, markAllAsRead);

module.exports = router;
