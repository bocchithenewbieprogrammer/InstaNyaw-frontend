const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },

    title: { type: String, default: "" },

    groupAvatar: { type: String, default: "" },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    // Extra metadata
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
