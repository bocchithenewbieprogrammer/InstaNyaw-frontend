const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const reportController = require("../controllers/reportController");

// USER REPORT POST
router.post("/", protect, reportController.reportPost);

module.exports = router;
