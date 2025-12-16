const Report = require("../models/Report");

exports.reportPost = async (req, res) => {
  try {
    const { postId, postType, reason } = req.body;

    if (!postId || !postType || !reason) {
      return res.status(400).json({ message: "Missing report data" });
    }

    const report = await Report.create({
      postId,
      postType,
      reason,
      reportedBy: req.user._id,
    });

    res.status(201).json({
      message: "Report submitted successfully",
      report,
    });
  } catch (err) {
    console.error("reportPost error:", err);
    res.status(500).json({ message: "Failed to submit report" });
  }
};
