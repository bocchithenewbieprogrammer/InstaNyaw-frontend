const express = require("express");
const router = express.Router();
const { register, login, logout, getProfile } = require("../controllers/authController"); // ✅ added getProfileconst { protect } = require("../middleware/authMiddleware");
const { protect } = require("../middleware/authMiddleware");


router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);

module.exports = router;
