const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const User = require("./models/User"); // required for auto-offline

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// =======================
// SOCKET.IO CONFIG
// =======================
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://127.0.0.1:5501",
      "http://localhost:5501",
      "https://bocchithenewbieprogrammer.github.io"
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// Make io available to routes
app.set("io", io);

// =======================
// EXPRESS PARSERS
// =======================
app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));


// =======================
// CORS
// =======================
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
      "http://127.0.0.1:5501",
      "http://localhost:5501",
    ],
    credentials: true,
  })
);

// =======================
// STATIC FILES
// =======================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =======================
// ROUTES
// =======================
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const birthdayRoutes = require("./routes/birthdayRoutes");
const schoolNewsRoutes = require("./routes/schoolNewsRoutes");
const lostFoundRoutes = require("./routes/lostFoundRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const shareRoutes = require("./routes/shareRoutes");
const profileRoutes = require("./routes/profileRoutes");
const homePostRoutes = require("./routes/homePostRoutes");
const messageRoutes = require("./routes/messageRoutes");
const usersRouter = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const activityRoutes = require("./routes/activityRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

app.use("/api/homeposts", homePostRoutes);

app.use("/api/activity", activityRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/birthdays", birthdayRoutes);
app.use("/api/news", schoolNewsRoutes);
app.use("/api/lostfound", lostFoundRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", usersRouter);
app.use("/api/reports", require("./routes/reportRoutes"));


// =======================
// ROOT TEST ROUTE
// =======================
app.get("/", (req, res) => {
  res.send("InstaNyaw! Backend is running 🚀");
});

// =======================
// MONGODB
// =======================
mongoose
  mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

// =======================
// SOCKET.IO HANDLERS (MERGED)
// =======================
let onlineUsers = new Map();  // <--- ADD THIS

io.on("connection", (socket) => {
  console.log("🔌 New client:", socket.id);

  // -----------------------------------
  // 1️⃣ REGISTER USER SOCKET
  // -----------------------------------
  socket.on("register_user", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected via socket ${socket.id}`);
  });

  // -----------------------------------
  // 2️⃣ JOIN CONVERSATION ROOM
  // -----------------------------------
  socket.on("join-conversation", (convId) => {
    socket.join(convId.toString());
    console.log(`Socket ${socket.id} joined ${convId}`);
  });

  // -----------------------------------
  // 3️⃣ MESSAGE TYPING INDICATOR
  // -----------------------------------
  socket.on("typing", ({ convId, userId }) => {
    socket.to(convId.toString()).emit("typing", { userId });
  });

  socket.on("stop-typing", ({ convId, userId }) => {
    socket.to(convId.toString()).emit("stop-typing", { userId });
  });

  // -----------------------------------
  // 4️⃣ REAL-TIME MESSAGE NOTIFICATION
  // (Facebook-style popup)
  // -----------------------------------
  socket.on("send_message_notification", (data) => {
    const receiverSocket = onlineUsers.get(data.receiverId);

    if (receiverSocket) {
      io.to(receiverSocket).emit("receive_message_notification", {
        senderId: data.senderId,
        senderName: data.senderName,
        senderAvatar: data.senderAvatar,
        message: data.message,
        convId: data.conversationId,
        createdAt: new Date()
      });

      console.log("📩 Notification sent to:", receiverSocket);
    }
  });

  // -----------------------------------
  // 5️⃣ CLEANUP ON DISCONNECT
  // -----------------------------------
  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);

    // remove user from map
    for (const [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        break;
      }
    }
  });
});



// =======================
// AUTO-OFFLINE SYSTEM
// =======================
setInterval(async () => {
  const cutoff = new Date(Date.now() - 2 * 60 * 1000);

  try {
    await User.updateMany(
      { lastSeen: { $lt: cutoff } },
      { isOnline: false }
    );
  } catch (err) {
    console.error("Auto offline error:", err);
  }
}, 60000);

// =======================
// START SERVER
// =======================
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

