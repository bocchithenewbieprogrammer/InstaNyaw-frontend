const LostAndFound = require("../models/LostAndFound");

// ==========================
// Create Entry
// ==========================
exports.createEntry = async (req, res) => {
  try {
    const { title, description, status, image, images, videos } = req.body;

    let finalImages = [];
    if (Array.isArray(images) && images.length) finalImages = images;
    else if (image) finalImages = [image];

    let finalVideos = [];
    if (Array.isArray(videos) && videos.length) finalVideos = videos;

    const entry = await LostAndFound.create({
      title,
      description,
      status,
      user: req.user._id,
      image: finalImages[0] || "",
      images: finalImages,
      videos: finalVideos
    });

    const populated = await LostAndFound.findById(entry._id)
      .populate("user", "username firstName lastName avatar department");

    res.status(201).json(populated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ==========================
// Get All Entries
// ==========================
exports.getEntries = async (req, res) => {
  try {
    const filter =
  req.user.role === "admin" || req.user.role === "headadmin"
  ? {}
  : { hidden: false };

const entries = await LostAndFound.find(filter)

      .sort({ createdAt: -1 })
      .populate("user", "username firstName lastName avatar department");

    res.json(entries);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==========================
// Update Entry
// ==========================
exports.updateEntry = async (req, res) => {
  try {
    const entry = await LostAndFound.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Item not found" });

    if (
      entry.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, description, status, image, images, videos } = req.body;

    if (title !== undefined) entry.title = title;
    if (description !== undefined) entry.description = description;
    if (status !== undefined) entry.status = status;

    let finalImages = entry.images || [];
    if (Array.isArray(images)) finalImages = images;
    else if (image) finalImages = [image];

    let finalVideos = entry.videos || [];
    if (Array.isArray(videos)) finalVideos = videos;

    entry.image = finalImages[0] || "";
    entry.images = finalImages;
    entry.videos = finalVideos;

    await entry.save();

    const updated = await LostAndFound.findById(entry._id)
      .populate("user", "username firstName lastName avatar department");

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



// ==========================
// Delete Entry
// ==========================
// Delete entry
exports.deleteEntry = async (req, res) => {
  try {
    const entry = await LostAndFound.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Item not found" });

    // owner or admin
    if (
      entry.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await entry.deleteOne();
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// 🔥 GET SINGLE LOST/FOUND ITEM
// ==========================
exports.getEntryById = async (req, res) => {
  try {
    const entry = await LostAndFound.findById(req.params.id)
      .populate("user", "username firstName lastName avatar department");

    if (!entry)
      return res.status(404).json({ message: "Item not found" });

    res.json(entry);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
