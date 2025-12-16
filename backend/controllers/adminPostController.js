// backend/controllers/adminPostController.js

const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const SchoolNews = require("../models/SchoolNews");
const LostAndFound = require("../models/LostAndFound");
const User = require("../models/User");

/**
 * Map our postType string to a Mongoose model.
 */
function getModelByType(postType) {
  switch (postType) {
    case "homepost":
      return HomePost;
    case "birthday":
      return BirthdayGreeting;
    case "announcement":
      return Announcement;
    case "news":
      return SchoolNews;
    case "lostfound":
      return LostAndFound;
    default:
      return null;
  }
}

/**
 * Resolve the "owner" userId of a post document based on its type.
 */
function getOwnerUserId(postType, doc) {
  if (!doc) return null;

  switch (postType) {
    case "homepost":
      return doc.user;          // HomePost: user
    case "lostfound":
      return doc.user;          // Lost & Found: user
    case "birthday":
      return doc.createdBy;     // Birthday: createdBy
    case "announcement":
      return doc.createdBy;     // Announcement: createdBy
    case "news":
      return doc.createdBy;     // SchoolNews: createdBy
    default:
      return null;
  }
}

/**
 * Check if req.user is allowed to moderate this post.
 * - headadmin  => can moderate everything
 * - admin      => can moderate only posts from same department
 * - others     => cannot moderate
 */
async function canModeratePost(reqUser, postType, doc) {
  if (!reqUser) return false;

  // 1) HeadAdmin: full power
  if (reqUser.role === "headadmin") return true;

  // 2) Only admins beyond this point
  if (reqUser.role !== "admin") return false;

  const ownerId = getOwnerUserId(postType, doc);
  if (!ownerId) return false;

  const owner = await User.findById(ownerId).select("department");
  if (!owner) return false;

  if (!reqUser.department || !owner.department) return false;

  return (
    reqUser.department.toLowerCase() === owner.department.toLowerCase()
  );
}

/**
 * Generic helper to load a post and enforce permission.
 * Returns { doc, postType, Model } or sends a response and returns null on error.
 */
async function loadPostAndCheck(req, res) {
  const { type, id } = req.params;
  const postType = String(type || "").toLowerCase();

  const Model = getModelByType(postType);
  if (!Model) {
    res.status(400).json({ message: "Invalid post type" });
    return null;
  }

  const doc = await Model.findById(id);
  if (!doc) {
    res.status(404).json({ message: "Post not found" });
    return null;
  }

  const allowed = await canModeratePost(req.user, postType, doc);
  if (!allowed) {
    res
      .status(403)
      .json({ message: "You are not allowed to moderate this post" });
    return null;
  }

  return { doc, postType, Model };
}

// ===============================
// HIDE POST  (PUT /api/admin/hide/:type/:id)
// ===============================
exports.hidePost = async (req, res) => {
  try {
    const result = await loadPostAndCheck(req, res);
    if (!result) return;

    const { doc, postType } = result;

    doc.hidden = true;
    await doc.save();

    res.json({
      message: "Post hidden successfully",
      postType,
      id: doc._id,
      hidden: doc.hidden,
    });
  } catch (err) {
    console.error("hidePost error:", err);
    res.status(500).json({ message: "Failed to hide post" });
  }
};

// ===============================
// UNHIDE POST (PUT /api/admin/unhide/:type/:id)
// ===============================
exports.unhidePost = async (req, res) => {
  try {
    const result = await loadPostAndCheck(req, res);
    if (!result) return;

    const { doc, postType } = result;

    doc.hidden = false;
    await doc.save();

    res.json({
      message: "Post unhidden successfully",
      postType,
      id: doc._id,
      hidden: doc.hidden,
    });
  } catch (err) {
    console.error("unhidePost error:", err);
    res.status(500).json({ message: "Failed to unhide post" });
  }
};

// ===============================
// ADMIN DELETE POST (DELETE /api/admin/delete/:type/:id)
// ===============================
exports.adminDeletePost = async (req, res) => {
  try {
    const result = await loadPostAndCheck(req, res);
    if (!result) return;

    const { doc, postType, Model } = result;

    await Model.deleteOne({ _id: doc._id });

    res.json({
      message: "Post deleted successfully",
      postType,
      id: doc._id,
    });
  } catch (err) {
    console.error("adminDeletePost error:", err);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// ===============================
// ADMIN EDIT POST (PUT /api/admin/edit/:type/:id)
// Allows editing text fields only
// ===============================
exports.adminEditPost = async (req, res) => {
  try {
    const result = await loadPostAndCheck(req, res);
    if (!result) return;

    const { doc, postType } = result;
    const { content, message, description, title, status } = req.body;

    // Update safe editable fields depending on type
    switch (postType) {
      case "homepost":
        if (typeof content === "string") doc.content = content;
        break;

      case "birthday":
        if (typeof message === "string") doc.message = message;
        break;

      case "announcement":
      case "news":
        if (typeof title === "string") doc.title = title;
        if (typeof content === "string") doc.content = content;
        break;

      case "lostfound":
        if (typeof title === "string") doc.title = title;
        if (typeof description === "string") doc.description = description;
        if (typeof status === "string") doc.status = status;
        break;
    }

    await doc.save();

    res.json({
      message: "Post updated successfully",
      postType,
      post: doc,
    });
  } catch (err) {
    console.error("adminEditPost error:", err);
    res.status(500).json({ message: "Failed to edit post" });
  }
};
