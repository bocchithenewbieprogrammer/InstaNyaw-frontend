// frontend/notifications.js
// Requires: CDN socket.io loaded BEFORE this file in Homepage.html
// Also assumes #notifIcon and #notifDropdown exist in DOM.

let notifSocket;

function initNotifSocket() {
  try {
    notifSocket = io(${API_BASE}
", {
      transports: ["websocket", "polling"],
      path: "/socket.io/"
    });

    notifSocket.on("connect", () => {
      console.log("🔗 Notif socket connected:", notifSocket.id);
      if (window.loggedInUser && window.loggedInUser._id) {
        notifSocket.emit("identify", window.loggedInUser._id);
      }
    });

    notifSocket.on("notification", (note) => {
      console.log("🔥 Realtime notification:", note);
      prependNotificationToDropdown(note);
      incrementNotifBadge(1);
    });

    notifSocket.on("notificationCount", ({ count }) => {
      setNotifBadge(count);
    });

  } catch (err) {
    console.warn("Could not init notif socket:", err);
  }
}

/* Badge helpers */
function getNotifBadgeEl() {
  let badge = document.getElementById("notifBadge");
  if (!badge) {
    const icon = document.getElementById("notifIcon");
    if (!icon) return null;
    badge = document.createElement("span");
    badge.id = "notifBadge";
    badge.className = "notif-badge";
    icon.parentNode.appendChild(badge);
  }
  return badge;
}

function setNotifBadge(count) {
  const b = getNotifBadgeEl();
  if (!b) return;
  if (!count || count <= 0) { b.style.display = "none"; return; }
  b.style.display = "inline-block";
  b.textContent = count > 99 ? "99+" : count;
}

function incrementNotifBadge(by = 1) {
  const b = getNotifBadgeEl();
  if (!b) return;
  const cur = parseInt(b.textContent || "0", 10) || 0;
  setNotifBadge(cur + by);
}

/* Load notifications list */
async function loadNotifications(page = 1) {
  const token = localStorage.getItem("token");
  const dropdown = document.getElementById("notifDropdown");
  if (!dropdown) return;
  dropdown.innerHTML = "<p>Loading...</p>";

  if (!token) {
    dropdown.innerHTML = "<p>Please log in to see notifications</p>";
    return;
  }

  try {
    const res = await fetch(`http://${API_BASE}
/api/notifications?page=${page}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Failed to fetch notifications");
    const items = await res.json();

    dropdown.innerHTML = "";
    if (!items || items.length === 0) {
      dropdown.innerHTML = "<p>No new notification</p>";
      return;
    }

    const list = document.createElement("div");
    list.className = "notif-list";

    items.forEach(n => {
      const a = document.createElement("a");
      a.href = "#";
a.onclick = (e) => {
    e.preventDefault();
    openPostModal(n.postId, n.postType);
};

      a.className = "notif-item";
      if (!n.isRead) a.classList.add("unread");

      const avatar = (n.sender && n.sender.avatar) || "final_icon-removebg-preview.png";
      const name = (n.sender && (n.sender.username || `${n.sender.firstName || ""}`)) || "Someone";
      const message = n.message || (n.type === "like" ? "liked your post" : "commented on your post");
      const time = new Date(n.createdAt).toLocaleString();
      const previewText = n.postPreview ? (n.postPreview.content || "").slice(0, 80) : "";

      a.innerHTML = `
        <img src="${avatar}" class="notif-avatar" />
        <div class="notif-body">
          <div class="notif-main"><strong>${name}</strong> <span class="notif-msg">${message}</span></div>
          <div class="notif-preview">${previewText}</div>
          <div class="notif-ts">${time}</div>
        </div>
      `;
      list.appendChild(a);
    });

    const footer = document.createElement("div");
    footer.className = "notif-footer";
    footer.innerHTML = `<a href="notifications.html">See all notifications</a>`;

    dropdown.appendChild(list);
    dropdown.appendChild(footer);

  } catch (err) {
    console.error("Failed to load notifications", err);
    dropdown.innerHTML = "<p>Error loading notifications</p>";
  }
}

/* Mark all read */
async function markAllNotificationsRead() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    await fetch(${API_BASE}
/api/notifications/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    setNotifBadge(0);
  } catch (err) {
    console.warn("Mark all read failed", err);
  }
}

/* Prepend realtime note */
function prependNotificationToDropdown(note) {
  const dropdown = document.getElementById("notifDropdown");
  if (!dropdown) return;

  const a = document.createElement("a");
  a.href = `post.html?id=${note.postId}`;
  a.className = "notif-item unread";

  const avatar = note.sender?.avatar || "final_icon-removebg-preview.png";
  const name = note.sender?.username || "Someone";
  const message = note.message || (note.type === "like" ? "liked your post" : "commented on your post");
  const time = new Date(note.createdAt).toLocaleString();
  const preview = (note.postPreview && note.postPreview.content) ? note.postPreview.content.slice(0,80) : "";

  a.innerHTML = `
    <img src="${avatar}" class="notif-avatar" />
    <div class="notif-body">
      <div class="notif-main"><strong>${name}</strong> <span class="notif-msg">${message}</span></div>
      <div class="notif-preview">${preview}</div>
      <div class="notif-ts">${time}</div>
    </div>
  `;

  const existingList = dropdown.querySelector(".notif-list");
  if (existingList) {
    existingList.prepend(a);
  } else {
    dropdown.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.className = "notif-list";
    wrapper.appendChild(a);
    dropdown.appendChild(wrapper);
  }

  incrementNotifBadge(1);
}

/* UI hooks */
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("notifIcon");
  const dropdown = document.getElementById("notifDropdown");
  if (!icon || !dropdown) return;

  icon.addEventListener("click", async (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    if (dropdown.style.display === "block") {
      await loadNotifications();
      await markAllNotificationsRead();
    }
  });

  document.addEventListener("click", (ev) => {
    if (!dropdown.contains(ev.target) && ev.target.id !== "notifIcon") {
      if (dropdown.style.display === "block") dropdown.style.display = "none";
    }
  });
});

/* Expose helpers so you can call them from Homepage.js after user loads */
window.initNotifSocket = initNotifSocket;
window.fetchUnreadCountAndSetBadge = async function() {
  const token = localStorage.getItem("token");
  if (!token) return;
  try {
    const res = await fetch(${API_BASE}
/api/notifications/unread-count", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    setNotifBadge(data.count || 0);
  } catch (err) {
    console.warn("Failed unread count:", err);
  }
};
