const Like = require("../models/Like");
const Notification = require("../models/Notification");

// MODELS FOR POST OWNER DETECTION
const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const SchoolNews = require("../models/SchoolNews");
const LostAndFound = require("../models/LostAndFound");

exports.likePost = async (req, res) => {
  try {
    const { postId, postType } = req.body;

    const existing = await Like.findOne({
      postId,
      postType,
      user: req.user._id,
    });

    // ============================
    // UNLIKE
    // ============================
    if (existing) {
      await existing.deleteOne();
      return res.json({ liked: false });
    }

    // ============================
    // LIKE
    // ============================
    await Like.create({
      postId,
      postType,
      user: req.user._id,
    });

    // ============================
    // GET POST OWNER
    // ============================
    let post = null;

    if (postType === "homepost")
      post = await HomePost.findById(postId).populate("user", "username avatar");

    if (postType === "birthday")
      post = await BirthdayGreeting.findById(postId).populate("createdBy", "username avatar");

    if (postType === "announcement")
      post = await Announcement.findById(postId).populate("createdBy", "username avatar");

    if (postType === "news")
      post = await SchoolNews.findById(postId).populate("createdBy", "username avatar");

    if (postType === "lostfound")
      post = await LostAndFound.findById(postId).populate("user", "username avatar");


    // Owner determination per type
    const owner =
      post?.user ||
      post?.createdBy ||
      null;

    // ============================
    // PREVENT SELF-NOTIFICATIONS
    // ============================
    if (owner && String(owner._id) !== String(req.user._id)) {
      await Notification.create({
        user: owner._id,            // recipient
        sender: req.user._id,       // liker
        postId,
        postType,
        type: "like",
        message: `${req.user.username} liked your post.`,
      });
    }

    res.json({ liked: true });
  } catch (err) {
    console.error("LIKE ERROR:", err);
    res.status(500).json({ message: "Like error" });
  }
};

exports.getLikes = async (req, res) => {
  try {
    const { postId, postType } = req.query;
    const likes = await Like.find({ postId, postType });
    res.json(likes);
  } catch (err) {
    res.status(500).json({ message: "Error loading likes" });
  }
};
