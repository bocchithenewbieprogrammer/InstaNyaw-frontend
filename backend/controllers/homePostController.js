// controllers/homePostController.js

const HomePost = require("../models/HomePost");
const Like = require("../models/Like");
const Comment = require("../models/Comment");

// ====================================================
// GET ALL HOME POSTS
// ====================================================
exports.getAllHomePosts = async (req, res) => {
  try {
    const isAdmin =
      req.user?.role === "admin" || req.user?.role === "headadmin";

    const filter = isAdmin ? {} : { hidden: false };

    const posts = await HomePost.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "username firstName lastName avatar department");

    const enriched = await Promise.all(
      posts.map(async (post) => {
        const likeCount = await Like.countDocuments({
          postId: post._id,
          postType: "homepost",
        });

        const commentCount = await Comment.countDocuments({
          postId: post._id,
          postType: "homepost",
        });

        return {
          ...post.toObject(),
          likeCount,
          commentCount,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("HomePost fetch error:", err);
    res.status(500).json({ message: "Failed to load home posts" });
  }
};

// ====================================================
// CREATE HOME POST — FULL IMAGE/VIDEO SUPPORT
// ====================================================
exports.createHomePost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    // ================================
    // 1. HANDLE IMAGES (multer)
    // ================================
    let imageFiles = [];
    if (req.files?.image) {
      req.files.image.forEach((file) => {
        imageFiles.push(`/uploads/${file.filename}`);
      });
    }

    // ================================
    // 2. HANDLE VIDEOS (multer)
    // ================================
    let videoFiles = [];
    if (req.files?.video) {
      req.files.video.forEach((file) => {
        videoFiles.push(`/uploads/${file.filename}`);
      });
    }

    // ================================
    // 3. CREATE HOME POST
    // ================================
    const post = await HomePost.create({
      user: req.user._id,
      content,
      image: imageFiles[0] || "",
      images: imageFiles,
      videos: videoFiles,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Create HomePost error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};



// ====================================================
// UPDATE HOME POST — FULL IMAGE/VIDEO SUPPORT
// ====================================================
exports.updateHomePost = async (req, res) => {
  try {
    let { content, image, images, videos } = req.body;

    const post = await HomePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.user.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" || req.user.role === "headadmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to edit" });
    }

    if (content) post.content = content;

    // ---------------------------
    // 🔥 PARSE IMAGES
    // ---------------------------
    let parsedImages = images;
    if (typeof images === "string") {
      try {
        parsedImages = JSON.parse(images);
      } catch {
        parsedImages = [];
      }
    }

    // ---------------------------
    // 🔥 PARSE VIDEOS
    // ---------------------------
    let parsedVideos = videos;
    if (typeof videos === "string") {
      try {
        parsedVideos = JSON.parse(videos);
      } catch {
        parsedVideos = [];
      }
    }

    // ---------------------------
    // 🔥 FINAL IMAGES
    // ---------------------------
    let finalImages = post.images || [];
    if (Array.isArray(parsedImages)) finalImages = parsedImages;
    else if (image) finalImages = [image];

    // ---------------------------
    // 🔥 FINAL VIDEOS
    // ---------------------------
    let finalVideos = post.videos || [];
    if (Array.isArray(parsedVideos)) finalVideos = parsedVideos;

    // Multer new videos
    if (Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file) => {
        finalVideos.push(`/uploads/videos/${file.filename}`);
      });
    } else if (req.file) {
      finalVideos.push(`/uploads/videos/${req.file.filename}`);
    }

    post.image = finalImages[0] || "";
    post.images = finalImages;
    post.videos = finalVideos;

    await post.save();

    res.json({ message: "Post updated", post });
  } catch (err) {
    console.error("Update HomePost error:", err);
    res.status(500).json({ message: "Failed to update post" });
  }
};

// ====================================================
// DELETE HOME POST
// ====================================================
exports.deleteHomePost = async (req, res) => {
  try {
    const post = await HomePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isOwner = post.user.toString() === req.user._id.toString();
    const isAdmin =
      req.user.role === "admin" || req.user.role === "headadmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete HomePost error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// ====================================================
// GET HOME POST BY ID
// ====================================================
exports.getHomePostById = async (req, res) => {
  try {
    const post = await HomePost.findById(req.params.id).populate(
      "user",
      "username avatar firstName lastName department"
    );

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (err) {
    console.error("GetHomePostById error:", err);
    res.status(500).json({ message: err.message });
  }
};
