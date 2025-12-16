const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createNews,
  getNews,
  updateNews,
  deleteNews,
  getNewsById            // ✅ IMPORT THIS
} = require("../controllers/schoolNewsController");

// Create
router.post("/", protect, createNews);

// Get all
router.get("/", protect, getNews);

// Get one 🔥
router.get("/:id", protect, getNewsById);

// Update
router.put("/:id", protect, updateNews);

// Delete
router.delete("/:id", protect, deleteNews);

module.exports = router;
