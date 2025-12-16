// backend/routes/users.js
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/User");
const { listUsers } = require("../controllers/usersController");


// =======================================================
// 1️⃣ GET ALL USERS (messaging list)
//     GET /api/users
// =======================================================
router.get("/", protect, listUsers);


// =======================================================
// 2️⃣ SEARCH USERS
//     GET /api/users/search?q=keyword
// =======================================================
router.get("/search", protect, async (req, res) => {
  try {
    const q = req.query.q?.trim() || "";

    if (!q) return res.json([]);

    const users = await User.find({
      $or: [
        { username:  { $regex: q, $options: "i" } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName:  { $regex: q, $options: "i" } },
      ],
    })
      .select("_id username firstName lastName avatar role department")
      .limit(20);

    res.json(users);

  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// =======================================================
// 3️⃣ GET SINGLE USER PROFILE (for visiting profile)
//     GET /api/users/:id
// =======================================================
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("_id username firstName lastName avatar role department bio createdAt");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (err) {
    console.error("❌ User load error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
