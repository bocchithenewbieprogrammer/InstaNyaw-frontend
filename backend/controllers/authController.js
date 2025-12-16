const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Allowed departments
const ALLOWED_DEPARTMENTS = ["CITE", "CAMP", "CASE", "CBEA", "CITHM"];

// ========================== REGISTER ==========================
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      department
    } = req.body;

    // Required fields check
    if (!firstName || !lastName || !email || !password || !department) {
      return res.status(400).json({
        message: "First name, last name, email, password, and department are required."
      });
    }

    // Department validation
    if (!ALLOWED_DEPARTMENTS.includes(department)) {
      return res.status(400).json({ message: "Invalid department selected." });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    // Auto generate username from email prefix
    const generatedUsername = email.split("@")[0];

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      department,
      username: generatedUsername,
      role: "student"
    });

    await newUser.save();

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        firstName,
        lastName,
        email,
        department,
        username: generatedUsername
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ========================== LOGIN ==========================
const login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Login using email OR username
    const user = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if banned
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been banned. Contact admin."
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid password" });

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        department: user.department
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ========================== LOGOUT ==========================
const logout = async (req, res) => {
  res.json({ message: "User logged out" });
};


// ========================== GET PROFILE ==========================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { register, login, logout, getProfile };
