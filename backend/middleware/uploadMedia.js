const multer = require("multer");
const path = require("path");

// ============================
// STORAGE CONFIG
// ============================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // make sure this folder exists
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

// ============================
// FILE FILTER
// ============================
function fileFilter(req, file, cb) {
  const allowedImage = ["image/jpeg", "image/png", "image/jpg"];
  const allowedVideo = ["video/mp4", "video/quicktime"];

  if (allowedImage.includes(file.mimetype) || allowedVideo.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only images and videos allowed."), false);
  }
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB max
});
