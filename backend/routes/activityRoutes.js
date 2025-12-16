// backend/routes/activityRoutes.js
const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  addActivity,
  getActivity,
} = require("../controllers/activityController");

router.post("/", protect, adminOnly, addActivity);
router.get("/", protect, adminOnly, getActivity);

module.exports = router;
