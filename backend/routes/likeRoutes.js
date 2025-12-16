const express = require("express");
const router = express.Router();
const { likePost, getLikes } = require("../controllers/likeController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, likePost);
router.get("/", protect, getLikes);

module.exports = router;
