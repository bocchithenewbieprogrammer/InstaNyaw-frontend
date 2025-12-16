const User = require("../models/User");

// ⭐ Post Models
const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const SchoolNews = require("../models/SchoolNews");
const LostAndFound = require("../models/LostAndFound");

// ⭐ GET ALL POSTS OF LOGGED IN USER
async function getMyPosts(req, res) {
  try {
    const userId = req.user._id;

    const [home, birthday, announcement, news, lost] = await Promise.all([
      HomePost.find({ user: userId }),
      BirthdayGreeting.find({ createdBy: userId }),
      Announcement.find({ createdBy: userId }),
      SchoolNews.find({ createdBy: userId }),
      LostAndFound.find({ user: userId }),
    ]);

    const all = [
      ...home.map((p) => ({ type: "homepost", ...p.toObject() })),
      ...birthday.map((p) => ({ type: "birthday", ...p.toObject() })),
      ...announcement.map((p) => ({ type: "announcement", ...p.toObject() })),
      ...news.map((p) => ({ type: "news", ...p.toObject() })),
      ...lost.map((p) => ({ type: "lostfound", ...p.toObject() })),
    ];

    all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load user posts" });
  }
}

// ⭐ GET LOGGED-IN USER PROFILE
async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ⭐ UPDATE PROFILE (username / bio / password)
async function updateMyProfile(req, res) {
  try {
    const { username, bio, password } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username !== user.username) {
      const exists = await User.findOne({ username });
      if (exists) return res.status(400).json({ message: "Username already taken" });
      user.username = username;
    }

    if (bio !== undefined) user.bio = bio;

    if (password && password.length >= 6) {
      user.password = password;
    } else if (password) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ⭐ UPDATE AVATAR
async function updateAvatar(req, res) {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ message: "No avatar provided" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.avatar = avatar;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ message: "Avatar updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ⭐ PUBLIC PROFILE (for viewing other users)
async function getPublicProfile(req, res) {
  try {
    const user = await User.findById(req.params.id).select("username bio avatar createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ⭐ EXPORT AT THE VERY END (IMPORTANT‼️)
module.exports = {
  getMyProfile,
  updateMyProfile,
  updateAvatar,
  getPublicProfile,
  getMyPosts,
};
