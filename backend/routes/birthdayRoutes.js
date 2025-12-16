const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createGreeting,
  getGreetings,
  deleteGreeting,
  updateGreeting,
  getGreetingById
} = require("../controllers/birthdayController");

// CREATE
router.post("/", protect, createGreeting);

// READ ALL
router.get("/", protect, getGreetings);

// READ ONE
router.get("/:id", protect, getGreetingById);

// UPDATE
router.put("/:id", protect, updateGreeting);

// DELETE
router.delete("/:id", protect, deleteGreeting);

module.exports = router;
