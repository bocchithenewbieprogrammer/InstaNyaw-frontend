const express = require("express");
const router = express.Router();
const { createPost, getPosts, updatePost, deletePost } = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");

// Routes (Protected)
router.post("/", protect, createPost);     // ✅ Only logged-in users can post
router.get("/", protect, getPosts);        // ✅ Logged-in users can view posts
router.put("/:id", protect, updatePost);   // ✅ Logged-in users can update their post
router.delete("/:id", protect, deletePost);// ✅ Logged-in users can delete

module.exports = router;
