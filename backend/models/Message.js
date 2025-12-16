const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // TEXT MESSAGE
  content: {
    type: String,
    default: "",
  },

  // MEDIA MESSAGE
  image: { type: String, default: null },
  video: { type: String, default: null },

  // FILE MESSAGE
  fileData: { type: String, default: null }, // base64/URL of actual file
  fileName: { type: String, default: null }, // filename.pdf
  fileType: { type: String, default: null }, // application/pdf

  // SEEN SYSTEM
  seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // DELETE FLAGS
  isDeleted: { type: Boolean, default: false },
  deletedForEveryone: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
