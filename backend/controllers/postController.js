const Post = require("../models/Post");

// CREATE POST (auto use logged-in user)
exports.createPost = async (req, res) => {
  try {
    const { content, category } = req.body;

    // make sure logged in user exists
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized. No user found in token." });
    }

    const newPost = new Post({
      user: req.user._id, // ✅ take user ID from token
      content,
      category,
      approved: category === "campus_wall" || req.user.role === "admin" // auto-approved for campus_wall or admin
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("❌ Error creating post:", error);
    res.status(500).json({ message: "Error creating post", error });
  }
};

// GET ALL POSTS (Feed)
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "username role");
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
};

// UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
};

// DELETE POST
exports.deletePost = async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
};
