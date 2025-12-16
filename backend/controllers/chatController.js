chatController.js
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

// START a conversation (or get existing one)
exports.startConversation = async (req, res) => {
  const { receiverId } = req.body;
  const senderId = req.user.id;

  try {
    let convo = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEND message
exports.sendMessage = async (req, res) => {
  const { conversationId, text } = req.body;

  try {
    const message = await Message.create({
      conversationId,
      sender: req.user.id,
      text,
    });

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET all messages in conversation
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.id,
    }).populate("sender", "username avatar");

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET conversation list
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user.id,
    }).populate("members", "username avatar");

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};