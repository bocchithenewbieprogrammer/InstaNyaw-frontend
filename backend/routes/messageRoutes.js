// routes/messageRoutes.js
const express = require("express");
const router = express.Router();

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

// ======================================================
// Helpers
// ======================================================
function isAdmin(conversation, userId) {
  return (
    Array.isArray(conversation.admins) &&
    conversation.admins.some((a) => a.toString() === userId.toString())
  );
}

function ensureSelfIsAdmin(conv, userId) {
  if (!Array.isArray(conv.admins)) conv.admins = [];
  if (!conv.admins.length) conv.admins.push(userId);
}

// ======================================================
// GET ALL CONVERSATIONS FOR USER
// ======================================================
router.get("/conversations", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const convs = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username avatar department")
      .sort({ updatedAt: -1 })
      .lean();

    const conversations = await Promise.all(
  convs.map(async (c) => {
    const [lastMsg, unreadCount] = await Promise.all([
      Message.findOne({ conversation: c._id })
        .sort({ createdAt: -1 })
        .lean(),

      Message.countDocuments({
        conversation: c._id,
        read: false,
        sender: { $ne: userId },
      }),
    ]);

    let convTitle = "";
    let convAvatar = "";

    if (c.isGroup) {
      // NEW CORRECT GROUP FIELDS
      convTitle = c.title || "Group chat";
      convAvatar = c.groupAvatar || "images/default-group.png";
    } else {
      const other = (c.participants || []).find(
        (p) => p && p._id.toString() !== userId.toString()
      );

      convTitle =
        other?.username ||
        `${other?.firstName || ""} ${other?.lastName || ""}`.trim() ||
        "Unknown";

      convAvatar = other?.avatar || "images/default.png";
    }

    return {
      _id: c._id,
      isGroup: c.isGroup,
      title: convTitle,
      groupAvatar: convAvatar,
      participants: c.participants,
      admins: c.admins || [],
      lastMessage: lastMsg || null,
      unreadCount,
    };
  })
);


    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load conversations" });
  }
});

// ======================================================
// GET MESSAGES FOR A CONVERSATION
// ======================================================
router.get("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id).lean();

    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some((p) => p.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Not your conversation" });

    const messages = await Message.find({ conversation: conv._id })
      .populate("sender", "username avatar firstName lastName")
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load messages" });
  }
});

// ======================================================
// SEND MESSAGE + REAL-TIME NOTIFICATION
// ======================================================
router.post("/conversations/:id/messages", protect, async (req, res) => {
  try {
    const io = req.app.get("io");  // <-- access socket.io instance

    const { content, image, video, fileData, fileName, fileType } = req.body;

    if (!content && !image && !video && !fileData)
      return res.status(400).json({ message: "Message cannot be empty" });

    const conv = await Conversation.findById(req.params.id)
      .populate("participants", "_id username avatar")
      .lean();

    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    if (!conv.participants.some(p => p._id.toString() === req.user._id.toString()))
      return res.status(403).json({ message: "Not your conversation" });

    // ----------------------------------
    // CREATE MESSAGE
    // ----------------------------------
    const msg = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content: content || "",
      image: image || null,
      video: video || null,
      fileData: fileData || null,
      fileName: fileName || null,
      fileType: fileType || null,
    });

    await Conversation.findByIdAndUpdate(req.params.id, {
      lastMessage: msg._id,
      updatedAt: new Date(),
    });

    const populated = await Message.findById(msg._id)
      .populate("sender", "username avatar")
      .lean();

    // ----------------------------------------------------------------
    // 🔥 REAL-TIME NOTIFICATION SYSTEM (FACEBOOK-STYLE)
    // ----------------------------------------------------------------
    // For every participant except the sender → send notification
    conv.participants.forEach((user) => {
      const userId = user._id.toString();
      const senderId = req.user._id.toString();

      if (userId !== senderId) {
        io.to(userId).emit("receive_message_notification", {
          senderId,
          senderName: populated.sender.username,
          senderAvatar: populated.sender.avatar,
          message: populated.content,
          convId: req.params.id,
          createdAt: new Date(),
        });
      }
    });

    // ----------------------------------------------------------------

    res.status(201).json(populated);

  } catch (err) {
    console.error("Message Send Error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
});


// ======================================================
// CREATE 1-ON-1 CONVERSATION
// ======================================================
router.post("/conversations", protect, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, targetUserId] },
    });

    if (existing) return res.json(existing);

    const conv = await Conversation.create({
      isGroup: false,
      participants: [req.user._id, targetUserId],
      admins: [],
    });

    const populated = await Conversation.findById(conv._id)
      .populate("participants", "username avatar department")
      .lean();

    res.json(populated);
  } catch (err) {
    console.error("1-on-1 create error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================================================
// CREATE GROUP
// (Frontend: POST /conversations/group)
// ======================================================
router.post("/conversations/group", protect, async (req, res) => {
  try {
    const { title, participantIds } = req.body;

    if (!participantIds || !Array.isArray(participantIds))
      return res.status(400).json({ message: "participantIds must be array" });

    const finalMembers = new Set(participantIds);
    finalMembers.add(req.user._id.toString());

    const conv = await Conversation.create({
      isGroup: true,
      title: title || "Group Chat",
      participants: Array.from(finalMembers),
      admins: [req.user._id],
    });

    const populated = await Conversation.findById(conv._id)
      .populate("participants", "username avatar department")
      .populate("admins", "_id");

    res.json(populated);
  } catch (err) {
    console.error("Group create error:", err);
    res.status(500).json({ message: "Failed to create group" });
  }
});

// ======================================================
// UPDATE GROUP META (name/avatar)
// (Frontend: PUT /conversations/:id/meta)
// ======================================================
router.put("/conversations/:id/meta", protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv || !conv.isGroup)
      return res.status(404).json({ message: "Group not found" });

    ensureSelfIsAdmin(conv, req.user._id);
    if (!isAdmin(conv, req.user._id))
      return res.status(403).json({ message: "Only admins can update group" });

    const { title, groupAvatar } = req.body;

    if (title) conv.title = title;
    if (groupAvatar) conv.groupAvatar = groupAvatar;

    await conv.save();

    const updated = await Conversation.findById(conv._id)
      .populate("participants", "username avatar department")
      .populate("admins", "_id");

    res.json(updated);
  } catch (err) {
    console.error("Group update error:", err);
    res.status(500).json({ message: "Failed to update group" });
  }
});

// ======================================================
// ADD / REMOVE MEMBERS
// (Frontend: PUT /conversations/:id/members)
// ======================================================
router.put("/conversations/:id/members", protect, async (req, res) => {
  try {
    let { add = [], remove = [] } = req.body;

    const conv = await Conversation.findById(req.params.id);
    if (!conv || !conv.isGroup)
      return res.status(404).json({ message: "Group not found" });

    ensureSelfIsAdmin(conv, req.user._id);
    if (!isAdmin(conv, req.user._id))
      return res.status(403).json({ message: "Only admins can manage members" });

    // Add
    add.forEach((u) => {
      if (!conv.participants.includes(u)) conv.participants.push(u);
    });

    // Remove
    remove.forEach((u) => {
      conv.participants = conv.participants.filter((p) => p.toString() !== u);
      conv.admins = conv.admins.filter((a) => a.toString() !== u);
    });

    await conv.save();

    const updated = await Conversation.findById(conv._id)
      .populate("participants", "username avatar department")
      .populate("admins", "_id");

    res.json(updated);
  } catch (err) {
    console.error("Member update error:", err);
    res.status(500).json({ message: "Failed to update group members" });
  }
});

// ======================================================
// LEAVE GROUP
// (Frontend: POST /conversations/:id/leave)
// ======================================================
router.post("/conversations/:id/leave", protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);

    if (!conv || !conv.isGroup)
      return res.status(404).json({ message: "Group not found" });

    const userId = req.user._id.toString();

    conv.participants = conv.participants.filter((p) => p.toString() !== userId);
    conv.admins = conv.admins.filter((a) => a.toString() !== userId);

    // If empty → delete group & messages
    if (conv.participants.length === 0) {
      await Message.deleteMany({ conversation: conv._id });
      await conv.deleteOne();
      return res.json({ deleted: true });
    }

    await conv.save();
    res.json({ left: true });
  } catch (err) {
    console.error("Leave group error:", err);
    res.status(500).json({ message: "Failed to leave group" });
  }
});

// ======================================================
// DELETE MESSAGE (soft delete)
// ======================================================
router.delete("/messages/:messageId", protect, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    const conv = await Conversation.findById(msg.conversation);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    const isSender = msg.sender.toString() === req.user._id.toString();

    if (!isSender && !isAdmin(conv, req.user._id))
      return res.status(403).json({ message: "Not allowed" });

    msg.content = "";
    msg.image = null;
    msg.video = null;
    msg.fileData = null;
    msg.fileName = null;
    msg.fileType = null;
    msg.isDeleted = true;

    await msg.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Message delete error:", err);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// ======================================================
// DELETE ENTIRE CONVERSATION
// ======================================================
router.delete("/conversations/:id", protect, async (req, res) => {
  try {
    const conv = await Conversation.findById(req.params.id);
    if (!conv) return res.status(404).json({ message: "Conversation not found" });

    const isParticipant = conv.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );

    if (!isParticipant)
      return res.status(403).json({ message: "Not your conversation" });

    await Message.deleteMany({ conversation: conv._id });
    await conv.deleteOne();

    res.json({ success: true });
  } catch (err) {
    console.error("Conversation delete error:", err);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
});

router.put("/:id/admins/promote", protect, async (req, res) => {
  const { userId } = req.body;

  const convo = await Conversation.findById(req.params.id);
  if (!convo) return res.status(404).json({ message: "Conversation not found" });

  if (!convo.admins.includes(req.user._id)) {
    return res.status(403).json({ message: "Only admins can promote members" });
  }

  if (!convo.admins.includes(userId)) {
    convo.admins.push(userId);
  }

  await convo.save();
  res.json(convo);
});


router.put("/:id/admins/demote", protect, async (req, res) => {
  const { userId } = req.body;

  const convo = await Conversation.findById(req.params.id);
  if (!convo) return res.status(404).json({ message: "Conversation not found" });

  if (!convo.admins.includes(req.user._id)) {
    return res.status(403).json({ message: "Only admins can demote admins" });
  }

  // prevent removing last admin
  if (convo.admins.length <= 1) {
    return res.status(400).json({ message: "Cannot remove the only admin" });
  }

  convo.admins = convo.admins.filter(id => id.toString() !== userId);
  await convo.save();

  res.json(convo);
});


module.exports = router;
