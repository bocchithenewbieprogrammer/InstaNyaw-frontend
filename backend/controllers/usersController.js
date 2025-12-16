// backend/controllers/usersController.js
const User = require('../models/User');

// GET /api/users
// Returns list of (non-sensitive) users for messaging
const listUsers = async (req, res) => {
  try {
    // Example: return only id, username, avatar, role
    const users = await User.find({}, '_id username avatar role').lean();
    // Optionally filter out the current user so you don't message yourself
    const filtered = users.filter(u => u._id.toString() !== req.user._id.toString());
    res.json(filtered);
  } catch (err) {
    console.error('Error listing users:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listUsers };
