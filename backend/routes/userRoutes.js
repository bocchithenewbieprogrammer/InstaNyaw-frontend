// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

/* ========================================================
   🟢 GET ALL USERS  (must be FIRST to avoid being overridden)
   ======================================================== */
router.get("/", protect, async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id username firstName lastName avatar department");

    res.json(users);
  } catch (err) {
    console.error("Load users error:", err);
    res.status(500).json({ message: "Failed to load users" });
  }
});

/* ========================================================
   🔍 SEARCH USERS  (required for Group Chat)
   ======================================================== */
router.get("/search", protect, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const filter = q
      ? {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { firstName: { $regex: q, $options: "i" } },
            { lastName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("_id username firstName lastName avatar department")
      .limit(50);

    res.json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ message: "Server error during search" });
  }
});

/* ========================================================
   🟢 USER PING (Maintains real-time status)
   ======================================================== */
router.post("/ping", protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: true,
      lastSeen: new Date(),
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Ping error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
});

/* ========================================================
   🟡 GET ONLINE / LAST SEEN STATUS
   ======================================================== */
router.get("/:id/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("isOnline lastSeen");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ message: "Server error fetching status" });
  }
});

/* ========================================================
   🧑‍💼 GET USER BY ID   (must be LAST!)
   ======================================================== */
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("User get error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
