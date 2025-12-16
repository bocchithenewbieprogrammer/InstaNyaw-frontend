const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  
  // 🆕 First Name + Last Name
firstName: { type: String, required: true, trim: true },
lastName: { type: String, required: true, trim: true },


  // (Username becomes optional but still supported)
  username: { type: String, unique: true, trim: true },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: { type: String, required: true, minlength: 6 },

  bio: { type: String, default: "" },

  // Avatar stored as base64 or URL
  avatar: {
    type: String,
    default: "/frontend/images/avatar.png"
  },

  // 🆕 Department field
  department: {
    type: String,
    enum: ["CITE", "CAMP", "CASE", "CBEA", "CITHM"],
    required: true
  },

  role: {
    type: String,
    enum: ["student", "employee", "admin"],
    default: "student"
  },

  isBanned: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },

    lastSeen: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
  
});


// 🆕 Virtual: Full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model("User", userSchema);
