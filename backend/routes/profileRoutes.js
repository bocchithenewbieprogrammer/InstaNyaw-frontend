// routes/profileRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
  getPublicProfile,
  getMyPosts
} = require("../controllers/profileController");

// ⭐ 1. Get MY profile
router.get("/me", protect, getMyProfile);

// ⭐ 2. Update profile
router.put("/update", protect, updateMyProfile);

// ⭐ 3. Update avatar
router.put("/avatar", protect, updateAvatar);

// ⭐ 4. MY POSTS (this must come BEFORE /:id)
router.get("/myposts", protect, getMyPosts);

// ⭐ 5. PUBLIC PROFILE (must always be LAST)
router.get("/:id", getPublicProfile);

module.exports = router;
