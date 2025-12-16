// backend/controllers/activityController.js
const ActivityLog = require("../models/ActivityLog");

// POST /api/activity
exports.addActivity = async (req, res) => {
  try {
    const { action, meta } = req.body;

    if (!action) {
      return res.status(400).json({ message: "Action is required" });
    }

    const log = await ActivityLog.create({
      admin: req.user._id,
      action,
      meta: meta || {},
    });

    // Populate admin basic info for frontend
    await log.populate("admin", "username firstName lastName role department");

    res.status(201).json(log);
  } catch (err) {
    console.error("addActivity error:", err);
    res.status(500).json({ message: "Failed to record activity" });
  }
};

// GET /api/activity?range=recent|today|week|month
exports.getActivity = async (req, res) => {
  try {
    const { range = "recent" } = req.query;

    const now = new Date();
    let fromDate = null;

    if (range === "today") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "week") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    } else if (range === "month") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    }

    const filter = {};
    if (fromDate) filter.createdAt = { $gte: fromDate };

    const logs = await ActivityLog.find(filter)
      .populate("admin", "username firstName lastName role department")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (err) {
    console.error("getActivity error:", err);
    res.status(500).json({ message: "Failed to load activity log" });
  }
};
