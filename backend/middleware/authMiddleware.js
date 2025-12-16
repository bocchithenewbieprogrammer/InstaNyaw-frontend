const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      // Attach user to req
      req.user = {
        _id: user._id,
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        bio: user.bio,
      };

      // ---------------------------------------------
      // ⭐ FIXED: Update lastSeen ONLY for messages API
      // ---------------------------------------------
      if (req.originalUrl.startsWith("/api/messages")) {
        await User.findByIdAndUpdate(req.user._id, {
          lastSeen: new Date(),
        });
      }

      // DO NOT set isOnline here.
      // isOnline is controlled ONLY by /api/users/ping
      // ---------------------------------------------

      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  } else {
    return res.status(401).json({ message: "No token provided" });
  }
};

// ADMIN PROTECTION
const adminOnly = (req, res, next) => {
  if (
    !req.user ||
    (req.user.role !== "admin" && req.user.role !== "headadmin")
  ) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { protect, adminOnly };
