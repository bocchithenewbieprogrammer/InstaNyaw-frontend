const Notification = require("../models/Notification");
const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const News = require("../models/SchoolNews");         // <-- ensure this file exists
const LostFound = require("../models/LostAndFound");  // <-- ensure this file exists
const Comment = require("../models/Comment");         // <-- missing import FIXED

// ===================== ADD COMMENT =====================
exports.addComment = async (req, res) => {
  try {
    const { postId, postType, content } = req.body;
    const userId = req.user._id;

    // Create comment
    const comment = await Comment.create({
      postId,
      postType,
      content,
      user: userId
    });

    // FIND POST OWNER
    let postOwner = null;

    if (postType === "homepost") {
      const post = await HomePost.findById(postId).populate("user");
      postOwner = post?.user?._id;
    }

    if (postType === "birthday") {
      const post = await BirthdayGreeting.findById(postId).populate("createdBy");
      postOwner = post?.createdBy?._id;
    }

    if (postType === "announcement") {
      const post = await Announcement.findById(postId).populate("createdBy");
      postOwner = post?.createdBy?._id;
    }

    if (postType === "news") {
      const post = await News.findById(postId).populate("createdBy");
      postOwner = post?.createdBy?._id;
    }

    if (postType === "lostfound") {
      const post = await LostFound.findById(postId).populate("user");
      postOwner = post?.user?._id;
    }

    // CREATE NOTIFICATION
    if (postOwner && postOwner.toString() !== userId.toString()) {
      await Notification.create({
        user: postOwner,
        sender: userId,
        message: "commented on your post",
        postId,
        postType,
        postPreview: content
      });
    }

    res.json(comment);
  } catch (err) {
    console.error("COMMENT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ===================== GET COMMENTS =====================
exports.getComments = async (req, res) => {
  try {
    const { postId, postType } = req.query;

    if (!postId || !postType) {
      return res.status(400).json({ message: "postId and postType are required" });
    }

    const comments = await Comment.find({ postId, postType })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    console.error("GET COMMENTS ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

