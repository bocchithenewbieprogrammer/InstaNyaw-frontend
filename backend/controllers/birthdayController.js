const BirthdayGreeting = require("../models/BirthdayGreeting");
const User = require("../models/User");

// ====================================================
// CREATE BIRTHDAY GREETING — FULL IMAGE/VIDEO SUPPORT
// ====================================================
exports.createGreeting = async (req, res) => {
  try {
    const { recipientUsername, message, image, images, videos } = req.body;

    if (!recipientUsername || !message) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const recipient = await User.findOne({ username: recipientUsername });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }

    // ------------------------------
    // 🔥 PARSE IMAGES STRING → ARRAY
    // ------------------------------
    let parsedImages = images;
    if (typeof images === "string") {
      try {
        parsedImages = JSON.parse(images);
      } catch (err) {
        parsedImages = [];
      }
    }

    // ------------------------------
    // 🔥 PARSE VIDEOS STRING → ARRAY
    // ------------------------------
    let parsedVideos = videos;
    if (typeof videos === "string") {
      try {
        parsedVideos = JSON.parse(videos);
      } catch (err) {
        parsedVideos = [];
      }
    }

    // ------------------------------
    // 🔥 FINAL IMAGES (max 20)
    // ------------------------------
    let finalImages = [];
    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
      finalImages = parsedImages.slice(0, 20);
    } else if (image) {
      finalImages = [image];
    }

    // ------------------------------
    // 🔥 FINAL VIDEOS (max 4)
    // ------------------------------
    let finalVideos = [];
    if (Array.isArray(parsedVideos) && parsedVideos.length > 0) {
      finalVideos = parsedVideos.slice(0, 4);
    }

    // ------------------------------
    // 🔥 CREATE GREETING
    // ------------------------------
    const greeting = new BirthdayGreeting({
      recipient: recipient._id,
      message,
      image: finalImages[0] || "",
      images: finalImages,
      videos: finalVideos,
      createdBy: req.user._id,
    });

    await greeting.save();

    const populated = await BirthdayGreeting.findById(greeting._id)
      .populate("createdBy", "username firstName lastName avatar department")
      .populate("createdBy", "username firstName lastName avatar department");

    res.status(201).json(populated);
  } catch (error) {
    console.error("🔥 BIRTHDAY ERROR:", error);
    res.status(500).json({ message: "Failed to post greeting." });
  }
};

// ====================================================
// GET GREETINGS
// ====================================================
exports.getGreetings = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" || req.user.role === "headadmin"
        ? {}
        : { hidden: false };

    const greetings = await BirthdayGreeting.find(filter)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username firstName lastName avatar department")
      .populate("recipient", "username firstName lastName avatar department");

    res.json(greetings);
  } catch (error) {
    console.error("GET GREETINGS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch greetings." });
  }
};

// ====================================================
// DELETE
// ====================================================
exports.deleteGreeting = async (req, res) => {
  try {
    const greeting = await BirthdayGreeting.findById(req.params.id);
    if (!greeting) return res.status(404).json({ message: "Greeting not found." });

    const isOwner = greeting.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized." });
    }

    await greeting.deleteOne();
    res.json({ message: "Greeting deleted successfully." });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Failed to delete greeting." });
  }
};

// ====================================================
// UPDATE GREETING — FULL SUPPORT
// ====================================================
exports.updateGreeting = async (req, res) => {
  try {
    const { message, image, images, videos } = req.body;

    const greeting = await BirthdayGreeting.findById(req.params.id);
    if (!greeting) return res.status(404).json({ message: "Greeting not found." });

    const isOwner = greeting.createdBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized." });
    }

    if (message) greeting.message = message;

    // PARSE images
    let parsedImages = images;
    if (typeof images === "string") {
      try {
        parsedImages = JSON.parse(images);
      } catch {
        parsedImages = [];
      }
    }

    let parsedVideos = videos;
    if (typeof videos === "string") {
      try {
        parsedVideos = JSON.parse(videos);
      } catch {
        parsedVideos = [];
      }
    }

    let finalImages = greeting.images || [];
    if (Array.isArray(parsedImages)) finalImages = parsedImages;
    else if (image) finalImages = [image];

    let finalVideos = greeting.videos || [];
    if (Array.isArray(parsedVideos)) finalVideos = parsedVideos;

    greeting.image = finalImages[0] || "";
    greeting.images = finalImages;
    greeting.videos = finalVideos;

    await greeting.save();

    const updated = await BirthdayGreeting.findById(greeting._id)
      .populate("createdBy", "username firstName lastName avatar department")
      .populate("recipient", "username firstName lastName avatar department");

    res.json(updated);
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ message: "Failed to update greeting." });
  }
};

// ====================================================
// GET SINGLE GREETING
// ====================================================
exports.getGreetingById = async (req, res) => {
  try {
    const greeting = await BirthdayGreeting.findById(req.params.id)
      .populate("createdBy", "username firstName lastName avatar department")

      .populate("createdBy", "username firstName lastName avatar department")
;

    if (!greeting)
      return res.status(404).json({ message: "Greeting not found." });

    res.json(greeting);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch greeting." });
  }
};
