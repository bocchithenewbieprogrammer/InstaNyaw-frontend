const Share = require("../models/Share");
const Post = require("../models/Post");

// SHARE Post
exports.sharePost = async (req, res) => {
  try {
    const { postId } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const share = new Share({
      post: postId,
      user: req.user._id
    });

    await share.save();
    res.status(201).json({ message: "Post shared", share });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET Shares for a Post
exports.getShares = async (req, res) => {
  try {
    const shares = await Share.find({ post: req.params.postId })
      .populate("user", "username email");

    res.json(shares);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
