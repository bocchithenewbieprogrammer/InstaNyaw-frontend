const express = require("express");
const router = express.Router();
const { sharePost, getShares } = require("../controllers/shareController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, sharePost); // Share post
router.get("/:postId", protect, getShares); // Get shares for post

module.exports = router;
