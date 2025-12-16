const SchoolNews = require("../models/SchoolNews");

// ==========================
// CREATE NEWS
// ==========================
exports.createNews = async (req, res) => {
  try {
    const { title, content, image, images, videos } = req.body;

    let finalImages = [];
    if (Array.isArray(images) && images.length) finalImages = images;
    else if (image) finalImages = [image];

    let finalVideos = [];
    if (Array.isArray(videos) && videos.length) finalVideos = videos;

    const news = await SchoolNews.create({
      title,
      content,
      createdBy: req.user._id,
      image: finalImages[0] || "",
      images: finalImages,
      videos: finalVideos
    });

    const populated = await SchoolNews.findById(news._id)
      .populate("createdBy", "username firstName lastName avatar department");

    res.status(201).json(populated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==========================
// GET ALL NEWS
// ==========================
exports.getNews = async (req, res) => {
  try {
   const filter =
  req.user.role === "admin" || req.user.role === "headadmin"
  ? {}
  : { hidden: false };

const news = await SchoolNews.find(filter)

      .sort({ createdAt: -1 })
      .populate("createdBy", "username firstName lastName avatar department");

    res.json(news);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// UPDATE NEWS
// ==========================
exports.updateNews = async (req, res) => {
  try {
    const { title, content, image, images, videos } = req.body;

    const news = await SchoolNews.findById(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });

    if (title) news.title = title;
    if (content) news.content = content;

    let finalImages = news.images || [];
    if (Array.isArray(images)) finalImages = images;
    else if (image) finalImages = [image];

    let finalVideos = news.videos || [];
    if (Array.isArray(videos)) finalVideos = videos;

    news.image = finalImages[0] || "";
    news.images = finalImages;
    news.videos = finalVideos;

    news.updatedAt = Date.now();

    await news.save();

    const populated = await SchoolNews.findById(news._id)
      .populate("createdBy", "username firstName lastName avatar department");

    res.json(populated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ==========================
// DELETE NEWS
// ==========================
// Delete news (owner or admin)
exports.deleteNews = async (req, res) => {
  try {
    const news = await SchoolNews.findById(req.params.id);
    if (!news) return res.status(404).json({ message: "News item not found" });

    if (
      news.createdBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to delete this news item" });
    }

    await news.deleteOne();
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    console.error("Delete News Error:", err);
    res.status(500).json({ message: "Server error while deleting news." });
  }
};

// ==========================
// 🔥 GET SINGLE NEWS ITEM
// ==========================
exports.getNewsById = async (req, res) => {
  try {
    const news = await SchoolNews.findById(req.params.id)
      .populate("createdBy", "username firstName lastName avatar department");

    if (!news)
      return res.status(404).json({ message: "News item not found" });

    res.json(news);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
