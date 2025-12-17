// Messages/script.js – FINAL FULL VERSION
// Uses: JWT in localStorage.token, backend at http://${API_BASE}

// 🔽 VERY TOP of the file
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  // ===============================
  // DOM ELEMENTS
  // ===============================
  const chatHeader = document.getElementById("chatHeader");
  const chatBody = document.getElementById("chatBody");
  const profilePanel = document.getElementById("profilePanel");
  const visitProfileBtn = document.getElementById("visitProfileBtn");
  const convList = document.querySelector(".chat-list");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");
  const mediaInput = document.getElementById("mediaInput");
  const fileInput = document.getElementById("fileInput");
  const chatSearch = document.getElementById("chatSearch");
  const searchResultsBox = document.getElementById("searchResults");
  const deleteConvBtn = document.getElementById("deleteConversationBtn");

  // Right panel tabs
  const tabButtons = document.querySelectorAll(".profile-tab-btn");
  const tabSections = document.querySelectorAll(".tab-section");

    // GROUP UI ELEMENTS
  const newGroupBtn = document.getElementById("newGroupBtn");
  const groupModal = document.getElementById("groupModal");
  const groupNameInput = document.getElementById("groupNameInput");
  const groupUsersList = document.getElementById("groupUsersList");
  const groupUserSearch = document.getElementById("groupUserSearch");
  const groupCreateBtn = document.getElementById("groupCreateBtn");
  const groupCancelBtn = document.getElementById("groupCancelBtn");

  const profileAvatarEl = document.getElementById("profileAvatar");
  const profileNameEl = document.getElementById("profileName");
  const profileDeptEl = document.getElementById("profileDepartment");
  const groupActionsEl = document.getElementById("groupActions");
  const groupMembersTitleEl = document.getElementById("groupMembersTitle");
  const groupMembersListEl = document.getElementById("groupMembersList");
  const groupAvatarInput = document.getElementById("groupAvatarInput");
  const groupEditNameBtn = document.getElementById("groupEditNameBtn");
  const groupAddMemberBtn = document.getElementById("groupAddMemberBtn");
  const groupLeaveBtn = document.getElementById("groupLeaveBtn");

  // ADD MEMBERS MODAL ELEMENTS
const addMembersModal = document.getElementById("addMembersModal");
const addMembersList = document.getElementById("addMembersList");
const addMembersSearch = document.getElementById("addMembersSearch");
const addMembersSubmit = document.getElementById("addMembersSubmit");
const addMembersClose = document.getElementById("addMembersClose");

if (groupAddMemberBtn) {
  groupAddMemberBtn.addEventListener("click", () => {
    openAddMembersModal();
  });
}

function openAddMembersModal() {
  if (!activeConversationIsGroup || !activeConversation) {
    alert("Open a group conversation first.");
    return;
  }

  addMembersModal.classList.add("active");

  // Clear old search
  addMembersSearch.value = "";

  // Render available users
  renderAddMembersList();
}

function closeAddMembersModal() {
  addMembersModal.classList.remove("active");
}

addMembersClose.addEventListener("click", closeAddMembersModal);

function renderAddMembersList(filter = "") {
  addMembersList.innerHTML = "";

  const term = filter.toLowerCase();

  const existingIds = activeConversation.participants.map(
    (p) => p._id || p.id || p
  );

  const filtered = allUsersCache.filter((u) => {
    if (u._id === currentUserId) return false; // skip self
    if (existingIds.includes(u._id)) return false; // skip already in group

    const name =
      u.username ||
      `${u.firstName || ""} ${u.lastName || ""}`.trim();

    return name.toLowerCase().includes(term);
  });

  filtered.forEach((u) => {
    const row = document.createElement("div");
    row.className = "modal-user-row";
    row.innerHTML = `
      <img src="${u.avatar || "images/default.png"}">
      <span>${u.username || `${u.firstName} ${u.lastName}`}</span>
      <input type="checkbox" data-id="${u._id}" style="margin-left:auto">
    `;

    row.addEventListener("click", (e) => {
      if (e.target.tagName !== "INPUT") {
        const cb = row.querySelector("input");
        cb.checked = !cb.checked;
      }
      row.classList.toggle("selected");
    });

    addMembersList.appendChild(row);
  });
}

addMembersSearch.addEventListener("input", () => {
  renderAddMembersList(addMembersSearch.value);
});

addMembersSubmit.addEventListener("click", async () => {
  const checked = addMembersList.querySelectorAll("input[type='checkbox']:checked");
  const ids = [...checked].map((cb) => cb.getAttribute("data-id"));

  if (ids.length === 0) {
    alert("Select at least one member.");
    return;
  }

  const res = await fetch(`${API_BASE}/conversations/${activeConversation._id}/members`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ add: ids }),
  });

  if (!res.ok) {
    alert("Failed to add members.");
    return;
  }

  const updated = await res.json();
  activeConversation = updated;

  closeAddMembersModal();
  loadMessages(updated._id);
});


  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabSections.forEach((sec) => {
        sec.classList.toggle("active", sec.dataset.tab === tab);
      });
    });
  });

  // ===============================
  // NAVBAR PROFILE DROPDOWN
  // ===============================
  const profileIcon = document.getElementById("profileIcon");
  const profileDropdown = document.getElementById("profileDropdown");
  const msgDropdown = document.getElementById("msgDropdown");
  const notifDropdown = document.getElementById("notifDropdown");

  if (profileIcon && profileDropdown) {
    profileIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle("active");
      msgDropdown?.classList.remove("active");
      notifDropdown?.classList.remove("active");
    });
  }

  document.addEventListener("click", (e) => {
    if (
      profileDropdown &&
      profileIcon &&
      !profileDropdown.contains(e.target) &&
      !profileIcon.contains(e.target)
    ) {
      profileDropdown.classList.remove("active");
    }
  });

  // ===============================
  // LOGOUT
  // ===============================
  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("department");
    localStorage.removeItem("username");
    window.location.href = "../Login/index.html";
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logoutUser);
  }

  // ===============================
  // NAV: HOME (LOGO)
  // ===============================
  const homeLogo = document.getElementById("homeLogo");
  if (homeLogo) {
    homeLogo.onclick = () => {
      window.location.href = "../../Homepage/Homepage.html";
    };
  }

  // ===============================
  // LOAD OTHER USER PROFILE (if visiting)
  // ===============================
  const urlParams = new URLSearchParams(window.location.search);
  const visitingUserId = urlParams.get("userId");

  async function loadUserProfile(id) {
    try {
      const res = await fetch(`http://${API_BASE}
/api/users/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) return;

      const user = await res.json();
      const nameEl = document.getElementById("profileName");
      const avatarEl = document.getElementById("profileAvatar");
      const deptEl = document.getElementById("profileDepartment");

      if (nameEl) {
        nameEl.textContent = `${user.firstName || ""} ${
          user.lastName || ""
        }`.trim();
      }
      if (avatarEl && user.avatar) {
        avatarEl.src = user.avatar;
      }
      if (deptEl && user.department) {
        deptEl.textContent = user.department;
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  }

  if (visitingUserId) {
    loadUserProfile(visitingUserId);
  }

  // ===============================
  // SEARCH USERS (TOP LEFT CHAT SEARCH)
  // ===============================
  async function searchUsers(query) {
    if (!query) {
      searchResultsBox.style.display = "none";
      searchResultsBox.innerHTML = "";
      return;
    }

    try {
      const res = await fetch(
        `http://${API_BASE}
/api/users/search?q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!res.ok) {
        searchResultsBox.style.display = "none";
        return;
      }

      const users = await res.json();
      if (!Array.isArray(users) || users.length === 0) {
        searchResultsBox.innerHTML =
          '<p class="no-users">No users found</p>';
        searchResultsBox.style.display = "block";
        return;
      }

      searchResultsBox.innerHTML = users
        .map(
          (u) => `
        <div class="search-item" data-id="${u._id}">
          <img src="${u.avatar || "images/default.png"}" />
          <div>
            <strong>${
              u.username ||
              `${u.firstName || ""} ${u.lastName || ""}`.trim()
            }</strong>
            <p style="font-size:12px; color:#888;">${
              u.department || ""
            }</p>
          </div>
        </div>
      `
        )
        .join("");

      searchResultsBox.style.display = "block";

      document.querySelectorAll(".search-item").forEach((item) => {
        item.addEventListener("click", async () => {
          const userId = item.getAttribute("data-id");
          searchResultsBox.style.display = "none";
          chatSearch.value = "";

          const convId = await ensureConversationWithUser(userId);
          if (convId) openConversation(convId);
        });
      });
    } catch (err) {
      console.error("Search error:", err);
    }
  }

  if (chatSearch && searchResultsBox) {
    chatSearch.addEventListener("input", () => {
      const query = chatSearch.value.trim();
      searchUsers(query);
    });
  }

// ===============================
// API, TOKEN, SOCKET
// ===============================
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";

const tokenKey = "token";
const token = localStorage.getItem(tokenKey);

if (!token) {
  console.warn("No token found in localStorage under key:", tokenKey);
}

// ===============================
// Heartbeat to mark user as online
// ===============================
setInterval(() => {
  if (!token) return;

  fetch(`${API_BASE}/api/users/ping`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {});
}, 15000);

// ===============================
// SOCKET.IO CONNECTION
// ===============================
const socket = io(API_BASE, {
  auth: { token },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});


  // ===============================
  // TOKEN → CURRENT USER ID
  // ===============================
  function parseToken(tok) {
    if (!tok) return null;
    try {
      const payload = tok.split(".")[1];
      const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const json = decodeURIComponent(
        atob(b64)
          .split("")
          .map(
            (c) =>
              "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)
          )
          .join("")
      );
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  const tokenPayload = parseToken(token);
  const currentUserId = tokenPayload?.id || tokenPayload?._id || null;

  // ===============================
  // ONLINE STATUS HELPERS
  // ===============================
  async function loadUserStatus(userId) {
    try {
      const res = await fetch(
        `http://${API_BASE}
/api/users/${userId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error("Status fetch error:", err);
      return null;
    }
  }

  function formatLastSeen(date) {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = (now - d) / 1000;

    if (diff < 60) return "Active just now";
    if (diff < 3600) return `Active ${Math.floor(diff / 60)} mins ago`;
    if (diff < 86400)
      return `Active ${Math.floor(diff / 3600)} hours ago`;

    return "Active " + d.toLocaleString();
  }

  // ===============================
  // STATE
  // ===============================
  let conversations = [];
  let activeConversationId = null;

    // Group-related state
  let activeConversationIsGroup = false;
  let activeConversation = null;
  let allUsersCache = []; // filled from /api/users

    // ===============================
  // CONVERSATION UI HELPERS
  // ===============================
  function createConversationElement(conv) {
    const el = document.createElement("div");
    el.className = "chat";
    el.setAttribute("data-conv-id", conv._id);

    const isGroup =
      conv.isGroup ||
      (Array.isArray(conv.participants) && conv.participants.length > 2);

    const img = document.createElement("img");

    if (isGroup) {
      img.src = conv.groupAvatar || "images/default.png";
      img.alt = conv.title || "Group Chat";
    } else {
      const other =
        conv.participants?.find(
          (p) => p && (p._id || p.id || p) !== currentUserId
        ) || conv.participants?.[0];

      img.src = other?.avatar || "images/default.png";
      img.alt = conv.title || "Conversation";
    }

    const info = document.createElement("div");
    info.className = "chat-info";

    const h4 = document.createElement("h4");
    let display = conv.title;

    if (isGroup) {
      if (!display && Array.isArray(conv.participants)) {
        const names = conv.participants
          .filter((p) => (p._id || p.id || p) !== currentUserId)
          .slice(0, 3)
          .map(
            (p) =>
              p.username ||
              `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
              "User"
          );
        display = names.join(", ");
      }
    } else if (!display && Array.isArray(conv.participants)) {
      const other2 =
        conv.participants.find(
          (p) => p && (p._id || p.id || p) !== currentUserId
        ) || conv.participants[0];
      display =
        other2?.username ||
        other2?.displayName ||
        (other2?._id || other2?.id || "Unknown");
    }

    h4.textContent = display || (isGroup ? "Group chat" : "Conversation");

    const p = document.createElement("p");
    p.textContent = conv.lastMessage?.content
      ? conv.lastMessage.content
      : conv.lastMessage?.fileName
      ? conv.lastMessage.fileName
      : "No messages yet";

    info.appendChild(h4);
    info.appendChild(p);

    el.appendChild(img);
    el.appendChild(info);

    if (conv.unreadCount) {
      const badge = document.createElement("div");
      badge.innerHTML = `<span class="notif-badge">${conv.unreadCount}</span>`;
      el.appendChild(badge);
    }

    el.addEventListener("click", () => openConversation(conv._id));

    return el;
  }


  function prependConversationToList(conv) {
    if (convList.querySelector(`[data-conv-id="${conv._id}"]`)) return;
    const el = createConversationElement(conv);
    convList.insertBefore(el, convList.firstChild);
  }

  // ===============================
  // LOAD CONVERSATIONS
  // ===============================
  async function loadConversations() {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error(
          "Failed to load conversations",
          await res.text().catch(() => "")
        );
        return;
      }
      const data = await res.json();
      conversations = (data || []).filter(
        (c) =>
          Array.isArray(c.participants) &&
          c.participants.every((p) => p !== null)
      );

      // Render them
      const existing = convList.querySelectorAll("[data-conv-id]");
      existing.forEach((el) => el.remove());

      conversations.forEach((conv) => prependConversationToList(conv));

      if (!activeConversationId && conversations.length) {
        openConversation(conversations[0]._id);
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
    }
  }

  // ===============================
  // CREATE/ENSURE CONVERSATION WITH USER
  // ===============================
  async function ensureConversationWithUser(targetUserId) {
    if (!token || !targetUserId) return null;

    const existing = conversations.find(
      (c) =>
        Array.isArray(c.participants) &&
        c.participants.some((p) => (p._id || p.id || p) == targetUserId)
    );
    if (existing) return existing._id;

    try {
      const res = await fetch(`${API_BASE}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) {
        console.error(
          "Failed to create conversation",
          await res.text().catch(() => "")
        );
        return null;
      }
      const conv = await res.json();
      conversations.unshift(conv);
      prependConversationToList(conv);
      return conv._id;
    } catch (err) {
      console.error("Error creating conversation:", err);
      return null;
    }
  }

  // ===============================
  // OPEN CONVERSATION
  // ===============================
  async function openConversation(convId) {
    activeConversationId = convId;

    document
      .querySelectorAll(".chat")
      .forEach((c) =>
        c.classList.toggle(
          "active",
          c.getAttribute("data-conv-id") === convId
        )
      );

    chatBody.innerHTML =
      '<div class="message received">Loading messages...</div>';

    if (socket && convId) {
      socket.emit("join-conversation", convId);
    }

    await loadMessages(convId);
  }

    // ===============================
  // LOAD MESSAGES (FIXED VERSION)
  // ===============================
// ===============================
// LOAD MESSAGES (OPTIMIZED VERSION)
// ===============================
async function loadMessages(convId, silent = false) {
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/conversations/${convId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (!silent) {
        console.error(
          "Failed to load messages",
          await res.text().catch(() => "")
        );
      }
      return;
    }

    const messages = await res.json();

    // FIND THE ACTIVE CONVERSATION OBJECT
    const conv = conversations.find((c) => c._id === convId);
    activeConversation = conv || null;

    const isGroup =
      conv &&
      (conv.isGroup ||
        (Array.isArray(conv.participants) &&
          conv.participants.length > 2));

    activeConversationIsGroup = !!isGroup;

    // CHAT HEADER + RIGHT PANEL ELEMENTS
    const headerImg = chatHeader?.querySelector("img");
    const headerName = chatHeader?.querySelector("h4");
    const headerStatus = chatHeader?.querySelector(".status");

    const pAvatar = profileAvatarEl;
    const pName = profileNameEl;
    const pDept = profileDeptEl;
    const gActions = groupActionsEl;
    const gTitle = groupMembersTitleEl;
    const gList = groupMembersListEl;

    // ================================
    // UPDATE HEADER + RIGHT PANEL
    // ================================
    if (conv) {
      if (isGroup) {
        // -------- GROUP CHAT HEADER --------
        const members = conv.participants || [];
        const groupName = conv.title || "Group chat";
        const groupAvatar = conv.groupAvatar || "images/default.png";

        if (headerImg) headerImg.src = groupAvatar;
        if (pAvatar) pAvatar.src = groupAvatar;

        if (headerName) headerName.textContent = groupName;
        if (pName) pName.textContent = groupName;

        const membersText = `${members.length} member${
          members.length === 1 ? "" : "s"
        }`;

        if (headerStatus) {
          headerStatus.textContent = membersText;
          headerStatus.style.color = "#65676b";
        }

        if (pDept) pDept.textContent = membersText;

        // SHOW GROUP ACTIONS + MEMBERS LIST
        if (gActions) gActions.style.display = "flex";
        if (gTitle) gTitle.style.display = "block";

        if (gList) {
          gList.style.display = "block";
          gList.innerHTML = "";

          // -------- ADMIN LIST (NORMALIZED TO STRING) --------
          const adminIds = (conv.admins || []).map((a) =>
            (a._id || a.id || a).toString()
          );
          const currentUserIsAdmin = adminIds.includes(
            currentUserId?.toString()
          );

          // -------- RENDER MEMBERS --------
          members.forEach((m) => {
            if (!m) return;

            const rawId = m._id || m.id || m;
            const idStr = rawId.toString();

            const name =
              m.username ||
              `${m.firstName || ""} ${m.lastName || ""}`.trim() ||
              "User";

            const memberIsAdmin = adminIds.includes(idStr);

            const row = document.createElement("div");
            row.className = "group-member-row";

            row.innerHTML = `
              <div class="member-main">
                <img src="${m.avatar || "images/default.png"}">
                <span>${name}</span>
                ${
                  memberIsAdmin
                    ? '<span class="admin-badge">Admin</span>'
                    : ""
                }
              </div>

              <div class="member-actions">
                ${
                  // Only admins see promote/demote buttons
                  currentUserIsAdmin && !memberIsAdmin
                    ? `<button class="promote-btn" data-id="${rawId}">Make admin</button>`
                    : ""
                }
                ${
                  currentUserIsAdmin && memberIsAdmin && idStr !== currentUserId?.toString()
                    ? `<button class="demote-btn" data-id="${rawId}">Remove admin</button>`
                    : ""
                }
                ${
                  currentUserIsAdmin && idStr !== currentUserId?.toString()
                    ? `<button class="member-remove-btn" data-user-id="${rawId}">&times;</button>`
                    : ""
                }
              </div>
            `;

            gList.appendChild(row);
          });

          // -------- ATTACH HANDLERS (ONLY ONCE PER RENDER) --------

          // Remove member
          gList.querySelectorAll(".member-remove-btn").forEach((btn) => {
            const targetId = btn.getAttribute("data-user-id");
            btn.addEventListener("click", () => {
              handleRemoveMember(conv._id, targetId);
            });
          });

          // Promote admin
          gList.querySelectorAll(".promote-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
              const uid = btn.getAttribute("data-id");
const res = await fetch(
  `${API_BASE}/${activeConversation._id}/admins/promote`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: uid }),
  }
);


              if (res.ok) {
                loadMessages(conv._id, true);
              } else {
                alert("Failed to promote user");
              }
            });
          });

          // Demote admin
          gList.querySelectorAll(".demote-btn").forEach((btn) => {
            btn.addEventListener("click", async () => {
              const uid = btn.getAttribute("data-id");
const res = await fetch(
  `${API_BASE}/${activeConversation._id}/admins/demote`,
  {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId: uid }),
  }
);


              if (res.ok) {
                loadMessages(conv._id, true);
              } else {
                alert("Failed to demote admin");
              }
            });
          });

          // Hide group edit/add buttons for non-admins
          if (!currentUserIsAdmin) {
            if (groupEditNameBtn) groupEditNameBtn.style.display = "none";
            if (groupAddMemberBtn) groupAddMemberBtn.style.display = "none";
          } else {
            if (groupEditNameBtn) groupEditNameBtn.style.display = "inline-flex";
            if (groupAddMemberBtn) groupAddMemberBtn.style.display = "inline-flex";
          }
        }
      } else {
        // ================================
        // 1-ON-1 CHAT UI
        // ================================
        const other =
          conv.participants?.find(
            (p) => (p._id || p.id || p) !== currentUserId
          ) || conv.participants?.[0];

        if (headerImg) {
          headerImg.src = other?.avatar || "images/default.png";
        }
        if (headerName) {
          headerName.textContent =
            conv.title ||
            other?.username ||
            `${other?.firstName || ""} ${other?.lastName || ""}`.trim() ||
            "Conversation";
        }
        if (pAvatar) pAvatar.src = other?.avatar || "images/default.png";
        if (pName) {
          pName.textContent =
            other?.username ||
            `${other?.firstName || ""} ${other?.lastName || ""}`.trim();
        }
        if (pDept && other?.department) {
          pDept.textContent = other.department;
        }

        // Last seen
        if (other && other._id && headerStatus) {
          loadUserStatus(other._id).then((status) => {
            if (!status) return;
            if (status.isOnline) {
              headerStatus.textContent = "Online now";
              headerStatus.style.color = "#28c840";
            } else {
              headerStatus.textContent = formatLastSeen(status.lastSeen);
              headerStatus.style.color = "#777";
            }
          });
        }

        // HIDE GROUP UI
        if (gActions) gActions.style.display = "none";
        if (gTitle) gTitle.style.display = "none";
        if (gList) {
          gList.style.display = "none";
          gList.innerHTML = "";
        }
      }
    }

    // ================================
    // RENDER MESSAGES
    // ================================
    chatBody.innerHTML = "";

    messages.forEach((m) => {
      const isMe =
        m.sender &&
        (typeof m.sender === "string"
          ? m.sender === currentUserId
          : m.sender._id === currentUserId);

      const div = document.createElement("div");
      div.className = "message " + (isMe ? "sent" : "received");

      const isDeleted = m.isDeleted || m.deletedForEveryone;

      // GROUP MESSAGES → show sender label
      if (!isMe && isGroup && !isDeleted) {
        let senderName = "";

        if (m.sender && typeof m.sender === "object") {
          senderName =
            m.sender.username ||
            `${m.sender.firstName || ""} ${
              m.sender.lastName || ""
            }`.trim();
        }

        if (senderName) {
          const senderLabel = document.createElement("div");
          senderLabel.className = "msg-sender";
          senderLabel.textContent = senderName;
          div.appendChild(senderLabel);
        }
      }

      // DELETED MESSAGE
      if (isDeleted) {
        const placeholder = document.createElement("div");
        placeholder.className = "deleted-msg";
        placeholder.textContent = "This message was deleted";
        div.appendChild(placeholder);
      } else {
        // TEXT
        if (m.content && m.content.trim() !== "") {
          const text = document.createElement("div");
          text.textContent = m.content;
          div.appendChild(text);
        }

        // IMAGE
        if (m.image && m.image.startsWith("data:image/")) {
          const img = document.createElement("img");
          img.src = m.image;
          img.className = "chat-img";
          img.style.marginTop = "8px";
          div.appendChild(img);
        }

        // VIDEO
        if (m.video && m.video.startsWith("data:video/")) {
          const vid = document.createElement("video");
          vid.src = m.video;
          vid.controls = true;
          vid.className = "chat-video";
          vid.style.marginTop = "8px";
          div.appendChild(vid);
        }

        // FILE
        if (m.fileData && m.fileName) {
          const fileLink = document.createElement("a");
          fileLink.href = m.fileData;
          fileLink.download = m.fileName;
          fileLink.className = "file-bubble";
          fileLink.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${m.fileName}`;
          div.appendChild(fileLink);
        }
      }

      // TIME + SEEN
      const info = document.createElement("div");
      info.style.fontSize = "11px";
      info.style.marginTop = "6px";
      info.style.opacity = "0.7";
      info.style.display = "flex";
      info.style.justifyContent = isMe ? "flex-end" : "flex-start";

      const timeText = new Date(m.createdAt).toLocaleString();
      let seenText = "";

      if (isMe && !isDeleted) {
        if (m.seenBy && m.seenBy.length > 1) {
          seenText = "✓ Seen";
        } else if (m.seenBy && m.seenBy.length === 1) {
          seenText = "✓ Delivered";
        }
      }

      info.innerHTML = `${timeText}${seenText ? " • " + seenText : ""}`;
      div.appendChild(info);

      // DELETE BUTTON (self only)
      if (isMe && !isDeleted) {
        const delBtn = document.createElement("button");
        delBtn.className = "delete-msg-btn";
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => {
          handleDeleteMessage(m._id);
        });
        div.appendChild(delBtn);
      }

      chatBody.appendChild(div);
    });

    chatBody.scrollTop = chatBody.scrollHeight;

    // UPDATE SHARED MEDIA/FILES
    updateSharedMedia(messages);
    updateSharedFiles(messages);
  } catch (err) {
    if (!silent) console.error("Error loading messages:", err);
  }
}




  // ===============================
  // SEND TEXT MESSAGE
  // ===============================
  async function sendMessageToBackend(text) {
    if (!token) {
      alert("No token: please login");
      return;
    }
    if (!activeConversationId) {
      alert("No conversation selected");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: text }),
        }
      );
      if (!res.ok) {
        console.error(
          "Failed to send message",
          await res.text().catch(() => "")
        );
        alert("Failed to send message");
        return;
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  }

  if (sendBtn && messageInput) {
    sendBtn.addEventListener("click", () => {
      const text = messageInput.value.trim();
      if (!text) return;
      sendMessageToBackend(text);
      messageInput.value = "";
    });

    messageInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;
        sendMessageToBackend(text);
        messageInput.value = "";
      }
    });
  }

  // ===============================
  // SEND IMAGE / VIDEO
  // ===============================
  if (mediaInput) {
    mediaInput.addEventListener("change", () => {
      const file = mediaInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          alert("Only image and video allowed!");
          return;
        }

        await sendMediaToBackend(base64, isImage ? "image" : "video");
        mediaInput.value = "";
      };
      reader.readAsDataURL(file);
    });
  }

  async function sendMediaToBackend(base64, type) {
    if (!activeConversationId) {
      alert("No conversation selected!");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: "",
            image: type === "image" ? base64 : null,
            video: type === "video" ? base64 : null,
            fileData: null,
            fileName: null,
            fileType: null,
          }),
        }
      );

      if (!res.ok) {
        console.error(
          "Failed to send media",
          await res.text().catch(() => "")
        );
        alert("Failed to send media.");
        return;
      }
    } catch (err) {
      console.error("Media send error:", err);
      alert("Failed to send media.");
    }
  }

  // ===============================
  // SEND FILE / DOCUMENT
  // ===============================
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        await sendFileToBackend(base64, file.name, file.type);
        fileInput.value = "";
      };
      reader.readAsDataURL(file);
    });
  }

  async function sendFileToBackend(fileData, fileName, fileType) {
    if (!activeConversationId) {
      alert("No conversation selected!");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/conversations/${activeConversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: "",
            image: null,
            video: null,
            fileData,
            fileName,
            fileType,
          }),
        }
      );

      if (!res.ok) {
        console.error(
          "Failed to send file",
          await res.text().catch(() => "")
        );
        alert("Failed to send file.");
        return;
      }
    } catch (err) {
      console.error("File send error:", err);
      alert("Failed to send file.");
    }
  }

    // ===============================
  // DELETE MESSAGE (FOR EVERYONE)
  // ===============================
  async function handleDeleteMessage(messageId) {
    if (!activeConversationId) return;
    if (!confirm("Delete this message for everyone?")) return;

    try {
      const res = await fetch(
        `http://${API_BASE}
/api/messages/messages/${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        console.error(
          "Failed to delete message",
          await res.text().catch(() => "")
        );
        alert("Failed to delete message");
        return;
      }

      await loadMessages(activeConversationId, true);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  }

  // ===============================
  // DELETE WHOLE CONVERSATION
  // ===============================
  async function handleDeleteConversation() {
    if (!activeConversationId) {
      alert("No conversation selected.");
      return;
    }
    if (!confirm("Delete this entire conversation for both users?")) return;

    try {
      const res = await fetch(
        `http://${API_BASE}
/api/messages/conversations/${activeConversationId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        console.error(
          "Failed to delete conversation",
          await res.text().catch(() => "")
        );
        alert("Failed to delete conversation");
        return;
      }

      conversations = conversations.filter(
        (c) => c._id !== activeConversationId
      );
      const el = document.querySelector(
        `.chat[data-conv-id="${activeConversationId}"]`
      );
      if (el) el.remove();

      activeConversationId = null;
      chatBody.innerHTML =
        '<div class="empty-chat">Conversation deleted</div>';
    } catch (err) {
      console.error("Error deleting conversation:", err);
    }
  }

  if (deleteConvBtn) {
    deleteConvBtn.addEventListener("click", handleDeleteConversation);
  }

  // ===============================
  // REFRESH CONVERSATIONS (SIDEBAR)
  // ===============================
  async function refreshConversationsList() {
    const fetchedItems = convList.querySelectorAll("[data-conv-id]");
    fetchedItems.forEach((item) => item.remove());

    const oldConvs = [...conversations];
    await loadConversations();

    if (activeConversationId) {
      const oldConv = oldConvs.find((c) => c._id === activeConversationId);
      const newConv = conversations.find(
        (c) => c._id === activeConversationId
      );

      if (
        oldConv &&
        newConv &&
        oldConv.lastMessage?._id !== newConv.lastMessage?._id
      ) {
        loadMessages(activeConversationId, true);
      }
    }
  }

  // ===============================
  // USERS LIST ON LEFT SIDE
  // ===============================
  function renderUsersList(users) {
    if (convList.querySelector(".users-block")) return;

    const container = document.createElement("div");
    container.className = "users-block";
    container.innerHTML = `
      <div class="users-header"><strong>Users</strong></div>
      <div class="users-list"></div>
    `;
    convList.insertBefore(container, convList.firstChild);

    const listEl = container.querySelector(".users-list");
    users.forEach((u) => {
      const row = document.createElement("div");
      row.className = "chat user-item";
      row.setAttribute("data-user-id", u._id);
      row.innerHTML = `
        <img src="${u.avatar || "images/default-avatar.png"}" />
        <div class="chat-info">
          <h4>${u.username || "User"}</h4>
          <p>${u.role || ""}</p>
        </div>
      `;

      row.addEventListener("click", async () => {
        const targetUserId = u._id;
        try {
          const createRes = await fetch(`${API_BASE}/conversations`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ targetUserId }),
          });
          if (!createRes.ok) {
            console.error(
              "Failed to create conversation with user",
              await createRes.text().catch(() => "")
            );
            return;
          }
          const conv = await createRes.json();
          conversations.unshift(conv);
          prependConversationToList(conv);
          openConversation(conv._id);
        } catch (err) {
          console.error("Error creating conversation:", err);
        }
      });

      listEl.appendChild(row);
    });
  }

async function loadUsersAndRender() {
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return;

    const users = await res.json();
    allUsersCache = Array.isArray(users) ? users : [];

    console.log("allUsersCache now contains:", allUsersCache);
    renderUsersList(users);
  } catch (err) {
    console.error("Error loading users:", err);
  }
}



    // ===============================
  // SOCKET LISTENERS
  // ===============================
  if (socket) {
    socket.on("new-message", (payload) => {
      const { conversation, message } = payload;
      if (!conversation || !message) return;

      if (conversation === activeConversationId) {
        loadMessages(activeConversationId, true);
      }

      refreshConversationsList();
    });

    socket.on("message-deleted", ({ conversation, messageId }) => {
      if (conversation === activeConversationId) {
        loadMessages(activeConversationId, true);
      }
    });

    socket.on("conversation-deleted", ({ conversation }) => {
      conversations = conversations.filter((c) => c._id !== conversation);
      const el = document.querySelector(
        `.chat[data-conv-id="${conversation}"]`
      );
      if (el) el.remove();

      if (activeConversationId === conversation) {
        activeConversationId = null;
        chatBody.innerHTML =
          '<div class="empty-chat">Conversation deleted</div>';
      }
    });
  }
  // ===============================
  // GROUP HELPERS
  // ===============================

  function openGroupModal(mode = "create") {
    if (!groupModal) return;

    groupModal.classList.add("active");
    groupNameInput.value =
      mode === "edit" && activeConversationIsGroup && activeConversation
        ? activeConversation.title || ""
        : "";

    renderGroupUsersList();
  }

  function closeGroupModal() {
    if (!groupModal) return;
    groupModal.classList.remove("active");
  }

  console.log("Rendering modal. allUsersCache=", allUsersCache);

  function renderGroupUsersList(filter = "") {
    if (!groupUsersList) return;
    groupUsersList.innerHTML = "";

    console.log("🔵 renderGroupUsersList() fired. allUsersCache:", allUsersCache);
    const term = filter.toLowerCase();

    // For add members: exclude already in group
    const existingIds =
      activeConversationIsGroup && activeConversation
        ? (activeConversation.participants || []).map(
            (p) => p._id || p.id || p
          )
        : [];

    (allUsersCache || []).forEach((u) => {
      if (!u || u._id === currentUserId) return;

      const id = u._id;
      const name =
        u.username ||
        `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
        "User";
      const dept = u.department || "";

      if (
        term &&
        !name.toLowerCase().includes(term) &&
        !dept.toLowerCase().includes(term)
      ) {
        return;
      }

      // In "add members" mode, skip users already in group
      if (
        activeConversationIsGroup &&
        activeConversation &&
        existingIds.includes(id)
      ) {
        return;
      }

      const row = document.createElement("div");
      row.className = "modal-user-row";
      row.innerHTML = `
        <img src="${u.avatar || "images/default.png"}" alt="">
        <div>
          <span>${name}</span>
          <div style="font-size:11px;color:#9ca3af;">${dept}</div>
        </div>
        <input type="checkbox" data-user-id="${id}">
      `;
      groupUsersList.appendChild(row);

      row.addEventListener("click", (e) => {
        if (e.target.tagName.toLowerCase() === "input") return;
        const checkbox = row.querySelector("input[type='checkbox']");
        checkbox.checked = !checkbox.checked;
      });
    });
  }

  async function createGroupOnBackend(title, memberIds) {
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/conversations/group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, participantIds: memberIds }),
      });

      if (!res.ok) {
        console.error(
          "Failed to create group",
          await res.text().catch(() => "")
        );
        alert("Failed to create group chat.");
        return null;
      }

      const conv = await res.json();
      conversations.unshift(conv);
      prependConversationToList(conv);
      return conv;
    } catch (err) {
      console.error("createGroupOnBackend error:", err);
      alert("Failed to create group chat.");
      return null;
    }
  }

  async function updateGroupMeta(convId, payload) {
    if (!token || !convId) return;
    try {
      const res = await fetch(`${API_BASE}/conversations/${convId}/meta`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(
          "Failed to update group meta",
          await res.text().catch(() => "")
        );
        alert("Failed to update group.");
        return;
      }
      const updated = await res.json();
      // Update local cache
      conversations = conversations.map((c) =>
        c._id === updated._id ? updated : c
      );
      activeConversation = updated;
      loadMessages(updated._id, true);
    } catch (err) {
      console.error("updateGroupMeta error:", err);
    }
  }

  async function handleRemoveMember(convId, userId) {
    if (!token || !convId || !userId) return;
    if (!confirm("Remove this member from the group?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/conversations/${convId}/members`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ remove: [userId] }),
        }
      );
      if (!res.ok) {
        console.error(
          "Failed to remove member",
          await res.text().catch(() => "")
        );
        alert("Failed to remove member.");
        return;
      }
      const updated = await res.json();
      conversations = conversations.map((c) =>
        c._id === updated._id ? updated : c
      );
      activeConversation = updated;
      loadMessages(updated._id, true);
    } catch (err) {
      console.error("handleRemoveMember error:", err);
    }
  }


  async function handleLeaveGroup() {
    if (!activeConversationId || !activeConversationIsGroup) return;
    if (!confirm("Leave this group chat?")) return;

    try {
      const res = await fetch(
        `${API_BASE}/conversations/${activeConversationId}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) {
        console.error(
          "Failed to leave group",
          await res.text().catch(() => "")
        );
        alert("Failed to leave group.");
        return;
      }

      // Remove conversation locally
      conversations = conversations.filter(
        (c) => c._id !== activeConversationId
      );
      const el = document.querySelector(
        `.chat[data-conv-id="${activeConversationId}"]`
      );
      if (el) el.remove();

      activeConversationId = null;
      activeConversation = null;
      activeConversationIsGroup = false;

      chatBody.innerHTML =
        '<div class="empty-chat">You left this group.</div>';

      if (groupActionsEl) groupActionsEl.style.display = "none";
      if (groupMembersTitleEl) groupMembersTitleEl.style.display = "none";
      if (groupMembersListEl) {
        groupMembersListEl.style.display = "none";
        groupMembersListEl.innerHTML = "";
      }
    } catch (err) {
      console.error("handleLeaveGroup error:", err);
    }
  }

  // ===============================
  // GROUP EVENT LISTENERS
  // ===============================

  if (newGroupBtn) {
    newGroupBtn.addEventListener("click", () => {
      openGroupModal("create");
    });
  }

  if (groupCancelBtn) {
    groupCancelBtn.addEventListener("click", () => {
      closeGroupModal();
    });
  }

  if (groupModal) {
    groupModal.addEventListener("click", (e) => {
      if (e.target === groupModal) {
        closeGroupModal();
      }
    });
  }

  if (groupUserSearch) {
    groupUserSearch.addEventListener("input", () => {
      renderGroupUsersList(groupUserSearch.value.trim());
    });
  }

  if (groupCreateBtn) {
    groupCreateBtn.addEventListener("click", async () => {
      const title = groupNameInput.value.trim() || "Group chat";

      const checkboxes =
        groupUsersList?.querySelectorAll("input[type='checkbox']");
      const memberIds = [];

      checkboxes?.forEach((cb) => {
        if (cb.checked) {
          memberIds.push(cb.getAttribute("data-user-id"));
        }
      });

      if (memberIds.length === 0) {
        alert("Select at least one member.");
        return;
      }

      // include current user automatically
      if (!memberIds.includes(currentUserId)) {
        memberIds.push(currentUserId);
      }

      const conv = await createGroupOnBackend(title, memberIds);
      if (conv) {
        closeGroupModal();
        openConversation(conv._id);
      }
    });
  }

  if (groupEditNameBtn) {
    groupEditNameBtn.addEventListener("click", () => {
      if (!activeConversationIsGroup || !activeConversation) return;
      const currentName = activeConversation.title || "Group chat";
      const newName = prompt("Enter new group name:", currentName);
      if (!newName || newName.trim() === "" || newName === currentName) return;
      updateGroupMeta(activeConversation._id, { title: newName.trim() });
    });
  }

  if (groupLeaveBtn) {
    groupLeaveBtn.addEventListener("click", handleLeaveGroup);
  }

  if (profileAvatarEl && groupAvatarInput) {
    profileAvatarEl.addEventListener("click", () => {
      if (!activeConversationIsGroup || !activeConversation) return;
      groupAvatarInput.click();
    });

    groupAvatarInput.addEventListener("change", () => {
      const file = groupAvatarInput.files[0];
      if (!file || !activeConversationIsGroup || !activeConversation) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        updateGroupMeta(activeConversation._id, {
          groupAvatar: base64,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // ===============================
  // INITIAL LOAD
  // ===============================
  loadConversations();
  loadUsersAndRender();

}); // END OF DOMContentLoaded

// ===============================
// SHARED MEDIA (IMAGES + VIDEOS ONLY)
// ===============================
function updateSharedMedia(messages) {
  const box = document.getElementById("sharedMedia");
  if (!box) return;

  box.innerHTML = "";

  messages.forEach((m) => {
    if (!m || m.isDeleted) return;

    // TRUE IMAGE
    if (
      m.image &&
      typeof m.image === "string" &&
      m.image.startsWith("data:image/")
    ) {
      const img = document.createElement("img");
      img.src = m.image;
      img.className = "media-thumb";
      box.appendChild(img);
      return;
    }

    // TRUE VIDEO
    if (
      m.video &&
      typeof m.video === "string" &&
      m.video.startsWith("data:video/")
    ) {
      const vid = document.createElement("video");
      vid.src = m.video;
      vid.className = "media-thumb";
      vid.controls = true;
      vid.muted = true;
      box.appendChild(vid);
      return;
    }

    // Anything else (PDF, DOCX, ZIP, etc.) → skip
  });
}

// ===============================
// SHARED FILES (PDF, DOCX, ZIP, ETC.)
// ===============================
function updateSharedFiles(messages) {
  const box = document.getElementById("sharedFiles");
  if (!box) return;

  box.innerHTML = "";

  messages.forEach((m) => {
    if (!m || m.isDeleted) return;

    if (m.fileData && m.fileName) {
      const item = document.createElement("a");
      item.className = "file-item";
      item.href = m.fileData;
      item.download = m.fileName;
      item.innerHTML = `
        <i class="fa-solid fa-file-lines"></i>
        <span>${m.fileName}</span>
      `;
      box.appendChild(item);
    }
  });
}
