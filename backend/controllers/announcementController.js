const Announcement = require("../models/Announcement");

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, image, images, videos } = req.body;

    // ---------------------------
    // NORMALIZE IMAGES (MAX 20)
    // ---------------------------
    let finalImages = [];

    if (Array.isArray(images) && images.length) {
      finalImages = images.filter(Boolean).slice(0, 20);  // max 20 images
    } else if (image && image.trim()) {
      finalImages = [image];
    }

    // ---------------------------
    // NORMALIZE VIDEOS (MAX 4)
    // ---------------------------
    let finalVideos = [];
    if (Array.isArray(videos) && videos.length) {
      finalVideos = videos.filter(Boolean).slice(0, 4);  // max 4 videos
    }

    const announcement = new Announcement({
      title,
      content,
      createdBy: req.user._id,
      images: finalImages,
      videos: finalVideos,
      image: finalImages[0] || "",
    });

    await announcement.save();
    res.status(201).json(announcement);

  } catch (err) {
    console.error("❌ Create Announcement Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// Get all announcements
exports.getAnnouncements = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" || req.user.role === "headadmin"
        ? {}
        : { hidden: false };

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username firstName lastName avatar department");

    res.json(announcements);
  } catch (err) {
    console.error("❌ Get Announcements Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement)
      return res.status(404).json({ message: "Announcement not found" });

    const { title, content, image, images, videos } = req.body;

    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;

    // ---------------------------
    // UPDATE IMAGES (MAX 20)
    // ---------------------------
    let finalImages = announcement.images || [];

    if (Array.isArray(images)) {
      finalImages = images.filter(Boolean).slice(0, 20);
    } else if (image) {
      finalImages = [image];
    }

    // ---------------------------
    // UPDATE VIDEOS (MAX 4)
    // ---------------------------
    let finalVideos = announcement.videos || [];

    if (Array.isArray(videos)) {
      finalVideos = videos.filter(Boolean).slice(0, 4);
    }

    announcement.image = finalImages[0] || "";
    announcement.images = finalImages;
    announcement.videos = finalVideos;

    announcement.updatedAt = Date.now();
    await announcement.save();

    res.json(announcement);

  } catch (err) {
    console.error("❌ Update Announcement Error:", err);
    res.status(500).json({ message: err.message });
  }
};


// Delete announcement (owner or admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // creator or admin
    if (
      announcement.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this announcement" });
    }

    await announcement.deleteOne();
    res.json({ message: "Announcement deleted successfully" });

  } catch (err) {
    console.error("❌ Delete Announcement Error:", err);
    res.status(500).json({ message: "Server error while deleting announcement." });
  }
};


// ==========================
// 🔥 GET SINGLE ANNOUNCEMENT
// ==========================
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "username firstName lastName avatar department");

    if (!announcement)
      return res.status(404).json({ message: "Announcement not found" });

    res.json(announcement);

  } catch (err) {
    console.error("❌ Get Announcement By ID Error:", err);
    res.status(500).json({ message: err.message });
  }
};
