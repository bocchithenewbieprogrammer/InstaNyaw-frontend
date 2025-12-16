const User = require("../models/User");
const HomePost = require("../models/HomePost");
const BirthdayGreeting = require("../models/BirthdayGreeting");
const Announcement = require("../models/Announcement");
const SchoolNews = require("../models/SchoolNews");
const LostAndFound = require("../models/LostAndFound");
const Like = require("../models/Like");
const Comment = require("../models/Comment");
const ActivityLog = require("../models/ActivityLog");
const Report = require("../models/Report.js");

function canModerateUser(adminUser, targetUser) {
  if (!adminUser) return false;

  // Head admin can manage anyone
  if (adminUser.role === "headadmin") return true;

  // Only sub-admins here, others no
  if (adminUser.role !== "admin") return false;

  if (!adminUser.department || !targetUser.department) return false;

  return (
    adminUser.department.toLowerCase() === targetUser.department.toLowerCase()
  );
}


// Helper: prevent modifying head admin
const isHeadAdmin = (user) => user.role === "headadmin";

// 📌 1. Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// BAN USER + AUTO-HIDE ALL THEIR POSTS (department-aware)
exports.banUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Department restriction
    if (!canModerateUser(req.user, user)) {
      return res.status(403).json({
        message: "You cannot ban users from another department",
      });
    }

    // Mark user as banned
    user.isBanned = true;
    await user.save();

    // Auto-hide ALL content they CREATED
    await Promise.all([
      HomePost.updateMany({ user: user._id }, { $set: { hidden: true } }),
      BirthdayGreeting.updateMany(
        { createdBy: user._id },
        { $set: { hidden: true } }
      ),
      Announcement.updateMany(
        { createdBy: user._id },
        { $set: { hidden: true } }
      ),
      SchoolNews.updateMany(
        { createdBy: user._id },
        { $set: { hidden: true } }
      ),
      LostAndFound.updateMany({ user: user._id }, { $set: { hidden: true } }),
    ]);

    res.json({
      message: "User banned and all their posts have been hidden",
    });
  } catch (err) {
    console.error("banUser error:", err);
    res
      .status(500)
      .json({ message: "Failed to ban user", error: err.message });
  }
};

// UNBAN USER + AUTO-UNHIDE ALL THEIR POSTS (department-aware)
exports.unbanUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Department restriction
    if (!canModerateUser(req.user, user)) {
      return res.status(403).json({
        message: "You cannot unban users from another department",
      });
    }

    // Mark user as unbanned
    user.isBanned = false;
    await user.save();

    // Auto-UNhide ALL content they CREATED
    await Promise.all([
      HomePost.updateMany({ user: user._id }, { $set: { hidden: false } }),
      BirthdayGreeting.updateMany(
        { createdBy: user._id },
        { $set: { hidden: false } }
      ),
      Announcement.updateMany(
        { createdBy: user._id },
        { $set: { hidden: false } }
      ),
      SchoolNews.updateMany(
        { createdBy: user._id },
        { $set: { hidden: false } }
      ),
      LostAndFound.updateMany(
        { user: user._id },
        { $set: { hidden: false } }
      ),
    ]);

    res.json({
      message: "User unbanned and all their posts have been unhidden",
    });
  } catch (err) {
    console.error("unbanUser error:", err);
    res
      .status(500)
      .json({ message: "Failed to unban user", error: err.message });
  }
};



// 📌 4. Update role (promote/demote)
exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;
    const target = await User.findById(req.params.id);

    if (!target) return res.status(404).json({ message: "User not found" });

    // 🔒 Only HEAD ADMIN can promote to admin or headadmin
    if ((role === "admin" || role === "headadmin") && req.user.role !== "headadmin") {
      return res.status(403).json({ message: "Only Head Admin can assign admin roles" });
    }

    // 🔒 Protect head admin
    if (isHeadAdmin(target) && req.user.role !== "headadmin") {
      return res.status(403).json({ message: "Cannot modify Head Admin" });
    }

    target.role = role;
    await target.save();

    res.json({ message: `${target.username} is now ${role}`, user: target });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 5. Delete user (only headadmin)
exports.deleteUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (req.user.role !== "headadmin")
      return res.status(403).json({ message: "Only Head Admin can delete accounts" });

    if (isHeadAdmin(target))
      return res.status(403).json({ message: "Cannot delete Head Admin" });

    await User.deleteOne({ _id: target.id });

    res.json({ message: `${target.username} has been deleted` });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ADMIN ANALYTICS
// GET /api/admin/analytics
// ===============================
exports.getAnalytics = async (req, res) => {
  try {
    // --- 1) BASIC TOTALS ---
    const [
      totalUsers,
      totalComments,
      totalLikes,
      homeCount,
      birthdayCount,
      announcementCount,
      newsCount,
      lostCount,
      hiddenHome,
      hiddenBirthday,
      hiddenAnnouncement,
      hiddenNews,
      hiddenLost,
      deptAgg,
    ] = await Promise.all([
      User.countDocuments({}),
      Comment.countDocuments({}),
      Like.countDocuments({}),
      HomePost.countDocuments({}),
      BirthdayGreeting.countDocuments({}),
      Announcement.countDocuments({}),
      SchoolNews.countDocuments({}),
      LostAndFound.countDocuments({}),
      HomePost.countDocuments({ hidden: true }),
      BirthdayGreeting.countDocuments({ hidden: true }),
      Announcement.countDocuments({ hidden: true }),
      SchoolNews.countDocuments({ hidden: true }),
      LostAndFound.countDocuments({ hidden: true }),
      // group users by department
      User.aggregate([
        {
          $group: {
            _id: { $toUpper: "$department" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalPosts =
      homeCount + birthdayCount + announcementCount + newsCount + lostCount;

    const totalHiddenPosts =
      hiddenHome +
      hiddenBirthday +
      hiddenAnnouncement +
      hiddenNews +
      hiddenLost;

    // --- 2) DEPARTMENT STATS ---
    const departments = {
      CITE: 0,
      CASE: 0,
      CBEA: 0,
      CITHM: 0,
      CAMP: 0,
    };

    deptAgg.forEach((row) => {
      if (!row._id) return;
      const key = row._id.toUpperCase();
      if (departments[key] !== undefined) {
        departments[key] = row.count;
      } else {
        // Any unexpected department, still keep it
        departments[key] = row.count;
      }
    });

    // --- 3) POSTS PER DAY (LAST 7 DAYS, ALL TYPES) ---
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // include today

    const makeDailyPipeline = (matchExtra = {}) => [
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          ...matchExtra,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ];

    const [
      homeDaily,
      birthdayDaily,
      announcementDaily,
      newsDaily,
      lostDaily,
      likesDaily,
      commentsDaily,
    ] = await Promise.all([
      HomePost.aggregate(makeDailyPipeline()),
      BirthdayGreeting.aggregate(makeDailyPipeline()),
      Announcement.aggregate(makeDailyPipeline()),
      SchoolNews.aggregate(makeDailyPipeline()),
      LostAndFound.aggregate(makeDailyPipeline()),
      Like.aggregate(makeDailyPipeline()),
      Comment.aggregate(makeDailyPipeline()),
    ]);

    const mergeDailyCounts = (...arrays) => {
      const map = new Map();
      arrays.forEach((arr) => {
        arr.forEach((item) => {
          const date = item._id;
          const prev = map.get(date) || 0;
          map.set(date, prev + item.count);
        });
      });
      const result = Array.from(map.entries()).map(([date, count]) => ({
        date,
        count,
      }));
      // sort by date ascending
      result.sort((a, b) => (a.date < b.date ? -1 : 1));
      return result;
    };

    const postsPerDay = mergeDailyCounts(
      homeDaily,
      birthdayDaily,
      announcementDaily,
      newsDaily,
      lostDaily
    );

    const likesPerDay = likesDaily
      .map((x) => ({ date: x._id, count: x.count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    const commentsPerDay = commentsDaily
      .map((x) => ({ date: x._id, count: x.count }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));

    // --- 4) TOP POST BY LIKE COUNT ---
const topLikeAgg = await Like.aggregate([
  {
    $group: {
      _id: { postId: "$postId", postType: "$postType" },
      likeCount: { $sum: 1 },
    },
  },
  { $sort: { likeCount: -1 } },
  { $limit: 1 },
]);

let topPost = null;

if (topLikeAgg.length > 0) {
  const { postId, postType } = topLikeAgg[0]._id;
  const likeCount = topLikeAgg[0].likeCount;

  let Model = null;
  let populateField = null;

  switch (postType) {
    case "homepost":
      Model = HomePost;
      populateField = "user";
      break;

    case "lostfound":
      Model = LostAndFound;
      populateField = "user";
      break;

    case "birthday":
      Model = BirthdayGreeting;
      populateField = "createdBy recipient";
      break;

    case "announcement":
      Model = Announcement;
      populateField = "createdBy";
      break;

    case "news":
      Model = SchoolNews;
      populateField = "createdBy";
      break;
  }

  if (Model) {
    const postDoc = await Model.findById(postId)
      .populate(populateField, "username firstName lastName avatar department")
      .lean();

    if (postDoc) {
      const commentCount = await Comment.countDocuments({
        postId,
        postType,
      });

      // Determine actual author
      let author =
        postDoc.user ||
        postDoc.createdBy ||
        postDoc.recipient ||
        null;

      topPost = {
        postId,
        postType,
        likeCount,
        commentCount,
        createdAt: postDoc.createdAt,
        content:
          postDoc.content ||
          postDoc.message ||
          postDoc.description ||
          postDoc.title ||
          "",
        user: author,
      };
    }
  }
}


    // --- 5) BUILD RESPONSE ---
    res.json({
      totals: {
        users: totalUsers,
        posts: totalPosts,
        comments: totalComments,
        likes: totalLikes,
        hiddenPosts: totalHiddenPosts,
      },
      postsByCategory: {
        homepost: homeCount,
        birthday: birthdayCount,
        announcement: announcementCount,
        news: newsCount,
        lostfound: lostCount,
      },
      departments,
      trends: {
        postsPerDay,
        likesPerDay,
        commentsPerDay,
      },
      topPost,
    });
  } catch (err) {
    console.error("getAnalytics error:", err);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
// ===============================
// ADMIN — REPORT SUMMARY
// GET /api/admin/reports/summary
// ===============================
exports.getReportSummary = async (req, res) => {
  try {
    const summary = await Report.aggregate([
      {
        $group: {
          _id: {
            postId: "$postId",
            postType: "$postType",
          },
          count: { $sum: 1 },
          reporters: { $addToSet: "$reportedBy" },
        },
      },
    ]);

    // populate reporters
    const enriched = await Promise.all(
      summary.map(async (r) => {
        const users = await User.find({ _id: { $in: r.reporters } })
          .select("username firstName lastName email")
          .lean();

        return {
          postId: r._id.postId,
          postType: r._id.postType,
          count: r.count,
          users,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("getReportSummary error:", err);
    res.status(500).json({ message: "Failed to load report summary" });
  }
};


