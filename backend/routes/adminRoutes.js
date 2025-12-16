const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");

const {
  getAllUsers,
  banUser,
  unbanUser,
  updateRole,
  deleteUser
} = require("../controllers/adminController");
const {
  hidePost,
  unhidePost,
  adminDeletePost,
  adminEditPost,
} = require("../controllers/adminPostController");

const { protect } = require("../middleware/authMiddleware");

// Admin-only access
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "headadmin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }
  next();
};
const {
  // ...your other functions...
  getAnalytics,
} = require("../controllers/adminController");

// Admin analytics (dashboard metrics)
router.get("/analytics", protect, adminOnly, getAnalytics);
router.get("/users", protect, adminOnly, getAllUsers);
router.put("/ban/:id", protect, adminOnly, banUser);
router.put("/unban/:id", protect, adminOnly, unbanUser);
router.put("/role/:id", protect, adminOnly, updateRole);
router.delete("/delete/:id", protect, adminOnly, deleteUser);
// =========================
//  POST MODERATION ROUTES
// =========================

// Hide a post
router.put("/hide/:type/:id", protect, adminOnly, hidePost);

// Unhide a post
router.put("/unhide/:type/:id", protect, adminOnly, unhidePost);

// Edit a post
router.put("/edit/:type/:id", protect, adminOnly, adminEditPost);

// Delete a post
router.delete("/delete/:type/:id", protect, adminOnly, adminDeletePost);

router.get("/reports/summary", protect, adminOnly, adminController.getReportSummary);





module.exports = router;
