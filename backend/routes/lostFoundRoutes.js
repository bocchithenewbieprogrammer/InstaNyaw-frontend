const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createEntry,
  getEntries,
  updateEntry,
  deleteEntry,
  getEntryById          // ✅ IMPORT THIS
} = require("../controllers/lostFoundController");

// Create
router.post("/", protect, createEntry);

// Get all
router.get("/", protect, getEntries);

// Get one 🔥
router.get("/:id", protect, getEntryById);

// Update
router.put("/:id", protect, updateEntry);

// Delete
router.delete("/:id", protect, deleteEntry);

module.exports = router;
