const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementById   // ✅ REQUIRED IMPORT
} = require("../controllers/announcementController");

// Create
router.post("/", protect, createAnnouncement);

// Get all
router.get("/", protect, getAnnouncements);

// 🔥 Get single announcement
router.get("/:id", protect, getAnnouncementById);

// Update
router.put("/:id", protect, updateAnnouncement);

// Delete
router.delete("/:id", protect, deleteAnnouncement);

module.exports = router;
