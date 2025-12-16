// ===============================
// API BASE
// ===============================
const API_BASE = "http://localhost:5000";
// ===============================
// AUTH HEADERS (USER SIDE)
// ===============================
function authHeaders(extra = {}) {
  return {
    Authorization: "Bearer " + localStorage.getItem("token"),
    ...extra,
  };
}

// ===============================
// Helper: Get full name
// ===============================
function getFullName(user) {
  if (!user) return "Unknown User";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
}


// Main center container
const mainCenter = document.getElementById("mainCenter");
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role");
  const adminBtn = document.getElementById("adminDashboardBtn");

  if (role === "admin" || role === "headadmin") {
    adminBtn.style.display = "block";

    adminBtn.addEventListener("click", () => {
      window.location.href = "../../AdminDashboard/analysis/analysis.html";
    });
  }
});

// =====================================
// Multi-media preview handler (GLOBAL)
// - For most posts: images + videos as base64 (JSON)
// - For home posts: images as base64, videos as File (multer)
// =====================================
function handleMediaInputChange(inputEl, previewId, imagesArrRef, videosArrRef, options = {}) {
  const { videoAsFile = false, imageAsFile = false } = options; // add imageAsFile


  const files = Array.from(inputEl.files || []);
  const preview = document.getElementById(previewId);
  if (!preview) return;

  imagesArrRef.length = 0;
  videosArrRef.length = 0;
  preview.innerHTML = "";

  if (!files.length) {
    preview.style.display = "none";
    return;
  }

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onload = (ev) => {
      const dataUrl = ev.target.result;

      // IMAGES: always store base64 (works with all your existing JSON APIs)
if (file.type.startsWith("image/")) {
  if (imageAsFile) {
    // 🔥 HOME POST MODE: store raw File (for multer)
    imagesArrRef.push(file);
    const url = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = url;
    preview.appendChild(img);
  } else {
    // default: store base64 (for birthday / news / etc.)
    imagesArrRef.push(dataUrl);
    const img = document.createElement("img");
    img.src = dataUrl;
    preview.appendChild(img);
  }
}


      // VIDEOS
      else if (file.type.startsWith("video/")) {
        // 🔥 HOME POST MODE: keep raw File for multer
        if (videoAsFile) {
          videosArrRef.push(file);
          const url = URL.createObjectURL(file);
          const vid = document.createElement("video");
          vid.src = url;
          vid.controls = true;
          preview.appendChild(vid);
        }
        // DEFAULT MODE: store base64 (for birthday, announcement, news, lost)
        else {
          videosArrRef.push(dataUrl);
          const vid = document.createElement("video");
          vid.src = dataUrl;
          vid.controls = true;
          preview.appendChild(vid);
        }
      }

      preview.style.display = "flex";
    };

    // Read file as data URL (for images + for non-home videos)
    reader.readAsDataURL(file);
  });
}




// ---------- Simple modal helpers ----------
const homeModal = document.getElementById("homePostModal");
const birthdayModal = document.getElementById("birthdayPostModal");
const announceModal = document.getElementById("announcementPostModal");
const newsModal = document.getElementById("newsPostModal");
const lostModal = document.getElementById("lostPostModal");

function openHomeModal() { 
  homeModal.classList.add("active"); 
  document.body.classList.add("modal-open");   // ⭐ ADD THIS
}

function closeHomeModal() { 
  homeModal.classList.remove("active"); 
  document.body.classList.remove("modal-open"); // ⭐ ADD THIS  
}

function openBirthdayModal() { birthdayModal.classList.add("active"); }
function closeBirthdayModal() { birthdayModal.classList.remove("active"); }

function openAnnouncementModal() { announceModal.classList.add("active"); }
function closeAnnouncementModal() { announceModal.classList.remove("active"); }

function openNewsModal() { newsModal.classList.add("active"); }
function closeNewsModal() { newsModal.classList.remove("active"); }

function openLostModal() { lostModal.classList.add("active"); }
function closeLostModal() { lostModal.classList.remove("active"); }

// 🔥 VIEW POST MODAL (for notifications / click anywhere)
const viewPostModal = document.getElementById("viewPostModal");
const viewPostContainer = document.getElementById("viewPostContainer");

function openViewPostModal() {
  if (viewPostModal) viewPostModal.classList.add("active");
}
function closeViewPostModal() {
  if (viewPostModal) viewPostModal.classList.remove("active");
}

// Media buffers
let homeImages = [], homeVideos = [];
let birthdayImages = [], birthdayVideos = [];
let announceImages = [], announceVideos = [];
let newsImages = [], newsVideos = [];
let lostImages = [], lostVideos = [];

// === UPDATE AVATARS ON PAGE === //
function applyUserAvatarToPage(user) {
  const fallback = "final_icon-removebg-preview.png";

  const postBarAvatar = document.getElementById("postBarAvatar");
  if (postBarAvatar) postBarAvatar.src = user.avatar || fallback;

  const birthdayPostBarAvatar = document.getElementById("birthdayPostBarAvatar");
  if (birthdayPostBarAvatar) birthdayPostBarAvatar.src = user.avatar || fallback;

  const announcePostBarAvatar = document.getElementById("announcePostBarAvatar");
  if (announcePostBarAvatar) announcePostBarAvatar.src = user.avatar || fallback;

  const newsPostBarAvatar = document.getElementById("newsPostBarAvatar");
  if (newsPostBarAvatar) newsPostBarAvatar.src = user.avatar || fallback;

  const lostPostBarAvatar = document.getElementById("lostPostBarAvatar");
  if (lostPostBarAvatar) lostPostBarAvatar.src = user.avatar || fallback;
}

// === LOAD USER PROFILE INTO NAVBAR & MODALS ===
async function loadUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = await res.json();
    if (!res.ok) throw new Error(user.message);

    window.loggedInUser = user;

    const fallback = "final_icon-removebg-preview.png";

    // Navbar
    const profileIcon = document.getElementById("profileIcon");
    const navUsername = document.getElementById("navUsername");
    if (profileIcon) profileIcon.src = user.avatar || fallback;
    if (navUsername) navUsername.textContent = `${user.firstName} ${user.lastName}`;

    // Role & department tags
    const navRoleTag = document.getElementById("navRoleTag");
    const navDeptTag = document.getElementById("navDeptTag");

    if (navRoleTag) {
      navRoleTag.textContent = user.role.toUpperCase();
      navRoleTag.className = `nav-tag role-${user.role}`;
    }

    if (navDeptTag) {
      navDeptTag.textContent = user.department.toUpperCase();
      navDeptTag.className = `nav-tag dept-${user.department?.toLowerCase()}`;
    }

    const navDepartment = document.getElementById("navDepartment");
    if (navDepartment) navDepartment.textContent = `(${user.department})`;

    applyUserAvatarToPage(user);

    // Modals: avatar + name
    const avatarIds = [
      "homeModalAvatar",
      "birthdayModalAvatar",
      "announceModalAvatar",
      "newsModalAvatar",
      "lostModalAvatar"
    ];
    const nameIds = [
      "homeModalName",
      "birthdayModalName",
      "announceModalName",
      "newsModalName",
      "lostModalName"
    ];

    avatarIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = user.avatar || fallback;
    });
    nameIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${user.username} (${getFullName(user)})`;
    });

  } catch (err) {
    console.error("⚠️ Failed to load user profile:", err);
  }
}

// Initial page load
window.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();
  changePage("Home", `<div id="homeFeed"><p>Loading feed...</p></div>`, true, "home");
  loadHomeFeed();
  if (window.loggedInUser) {
    applyUserAvatarToPage(window.loggedInUser);
  }
});

// === DYNAMIC PAGE SWITCHER ===
function changePage(title, content, showPostBox = false, pageType = "home") {
  mainCenter.innerHTML = `
    <h2 id="pageTitle">${title}</h2>
    ${showPostBox ? `
      <div class="create-post">
        <div class="ptop">
          <img id="postBarAvatar" src="final_icon-removebg-preview.png" alt="">
          <input type="text" placeholder="What's on your mind?" id="openPostModal" data-page="${pageType}" readonly>
        </div>
      </div>
    ` : ""}
    <div class="page-content">${content}</div>
  `;

  if (window.loggedInUser) {
    applyUserAvatarToPage(window.loggedInUser);
  }

  const input = document.getElementById("openPostModal");
  if (input) {
    input.addEventListener("click", () => {
      const p = input.dataset.page || pageType;
      switch (p) {
        case "home":        openHomeModal();        break;
        case "birthday":    openBirthdayModal();    break;
        case "announcement":openAnnouncementModal();break;
        case "news":        openNewsModal();        break;
        case "lost":        openLostModal();        break;
      }
    });
  }
}

// =========================
// PAGE BUTTONS (left menu)
// =========================
document.getElementById("homeBtn").addEventListener("click", () => {
  changePage("Home", `<div id="homeFeed"><p>Loading feed...</p></div>`, true, "home");
  loadHomeFeed();
});

document.getElementById("birthdayBtn").addEventListener("click", () => {
  changePage("Birthday Greetings 🎉", `<div id="birthdayFeed"><p>Loading greetings...</p></div>`, true, "birthday");
  loadBirthdayGreetings();
});

document.getElementById("announcementBtn").addEventListener("click", () => {
  changePage("Announcements 📢", `<div id="announcementFeed"><p>Loading announcements...</p></div>`, true, "announcement");
  loadAnnouncements();
});

document.getElementById("newsBtn").addEventListener("click", () => {
  changePage("School News 📰", `<div id="newsFeed"><p>Loading school news...</p></div>`, true, "news");
  loadSchoolNews();
});

document.getElementById("lostBtn").addEventListener("click", () => {
  changePage("Lost and Found ⚠️", `<div id="lostFeed"><p>Loading lost and found posts...</p></div>`, true, "lost");
  loadLostItems();
});

// =========================
// GLOBAL EDIT STATE
// =========================
window.currentEdit = null; // { id, type }
window.currentFeedPosts = [];

// =========================
// SHARED EDIT/DELETE HTML
// =========================
function getEditDeleteHTML(post) {
  const currentUser = window.loggedInUser || {};
  const currentUserId = currentUser._id;
  const isAdmin = currentUser.role === "admin" || currentUser.role === "headadmin";

  const ownerId =
    post.user?._id ||
    post.createdBy?._id ||
    post.recipient?._id;

  const isOwner = ownerId && currentUserId && ownerId === currentUserId;

  const canEdit = !!isOwner;
  const canDelete = !!(isOwner || isAdmin);

  if (!canEdit && !canDelete) return "";

  return `
    <div class="post-actions" style="margin-left:auto; display:flex; gap:6px;">
      ${canEdit ? `<button class="edit-btn" data-id="${post._id}" data-type="${post.type}">Edit</button>` : ""}
      ${canDelete ? `<button class="delete-btn" data-id="${post._id}" data-type="${post.type}">Delete</button>` : ""}
    </div>
  `;
}

// =================================================
// Lost & Found (load/create)
// =================================================
async function loadLostItems() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("lostFeed");
  if (!feed) return;
  if (!token) {
    feed.innerHTML = "<p>Please log in to view lost/found posts.</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/lostfound", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.length) {
      feed.innerHTML = "<p>No items yet. 🕵️</p>";
      return;
    }

    const typed = data.map(item => ({ type: "lostfound", ...item }));
    window.currentFeedPosts = typed;
    feed.innerHTML = typed.map(renderPostHTML).join("");
    typed.forEach(p => loadLikeCount(p._id, p.type));

    attachEditButtons();
    attachDeleteButtons();
    attachLikeButtons();
    attachCommentButtons();

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Failed to load lost/found items.</p>";
  }
}

// Lost modal: preview & submit
document.getElementById("lostImageIcon").addEventListener("click", () =>
  document.getElementById("lostFileInput").click()
);

document.getElementById("lostFileInput").addEventListener("change", (e) => {
  handleMediaInputChange(
    e.target,
    "lostPreviewContainer",
    lostImages,
    lostVideos
  );
});

document.getElementById("lostPostBtn").onclick = async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("lostTitleInput").value.trim();
  const description = document.getElementById("lostPostMessage").value.trim();
  const status = document.getElementById("lostStatusSelect").value;

  if (!title || !description)
    return alert("Please complete all fields.");

  const isEditing = window.currentEdit && window.currentEdit.type === "lostfound";

  const url = isEditing
    ? `http://localhost:5000/api/lostfound/${window.currentEdit.id}`
    : "http://localhost:5000/api/lostfound";

  const method = isEditing ? "PUT" : "POST";

  const body = { title, description, status };
  if (lostImages.length > 0) body.images = lostImages;
  if (lostVideos.length > 0) body.videos = lostVideos;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    showNotification("Lost & Found posted!", "success");
    closeLostModal();
    loadHomeFeed();

  } catch (err) {
    showNotification(err.message, "error");
  }
};

// =================================================
// School News
// =================================================
async function loadSchoolNews() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("newsFeed");
  if (!feed) return;
  if (!token) {
    feed.innerHTML = "<p>Please log in to view news.</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.length) {
      feed.innerHTML = "<p>No news yet. 📰</p>";
      return;
    }

    const typed = data.map(n => ({ type: "news", ...n }));
    window.currentFeedPosts = typed;
    feed.innerHTML = typed.map(renderPostHTML).join("");
    typed.forEach(p => loadLikeCount(p._id, p.type));

    attachEditButtons();
    attachDeleteButtons();
    attachLikeButtons();
    attachCommentButtons();

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Failed to load school news.</p>";
  }
}

// News modal preview & submit
document.getElementById("newsImageIcon").addEventListener("click", () =>
  document.getElementById("newsFileInput").click()
);

document.getElementById("newsFileInput").addEventListener("change", (e) => {
  handleMediaInputChange(
    e.target,
    "newsPreviewContainer",
    newsImages,
    newsVideos
  );
});

document.getElementById("newsPostBtn").onclick = async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("newsTitleInput").value.trim();
  const content = document.getElementById("newsPostMessage").value.trim();

  if (!title || !content)
    return alert("Please complete all fields.");

  const isEditing = window.currentEdit && window.currentEdit.type === "news";

  const url = isEditing
    ? `http://localhost:5000/api/news/${window.currentEdit.id}`
    : "http://localhost:5000/api/news";

  const method = isEditing ? "PUT" : "POST";

  const body = { title, content };
  if (newsImages.length > 0) body.images = newsImages;
  if (newsVideos.length > 0) body.videos = newsVideos;

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    showNotification("News posted!", "success");
    closeNewsModal();
    loadHomeFeed();

  } catch (err) {
    showNotification(err.message, "error");
  }
};

// =================================================
// Announcements
// =================================================
async function loadAnnouncements() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("announcementFeed");
  if (!feed) return;
  if (!token) {
    feed.innerHTML = "<p>Please log in to view announcements.</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/announcements", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    if (!data.length) {
      feed.innerHTML = "<p>No announcements yet 📢</p>";
      return;
    }

    const typed = data.map(a => ({ type: "announcement", ...a }));
    window.currentFeedPosts = typed;
    feed.innerHTML = typed.map(renderPostHTML).join("");
    typed.forEach(p => loadLikeCount(p._id, p.type));

    attachEditButtons();
    attachDeleteButtons();
    attachLikeButtons();
    attachCommentButtons();

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Failed to load announcements.</p>";
  }
}

// announce modal preview & submit
// =================================================
// Announcements
// =================================================

// Open file picker
document.getElementById("announceImageIcon").addEventListener("click", () =>
  document.getElementById("announceFileInput").click()
);

// When selecting images/videos
document.getElementById("announceFileInput").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  const images = files.filter(f => f.type.startsWith("image/"));
  const videos = files.filter(f => f.type.startsWith("video/"));

  // LIMIT IMAGES: max 20
  if (announceImages.length + images.length > 20) {
    alert("You can upload a maximum of 20 images.");
    e.target.value = "";
    return;
  }

  // LIMIT VIDEOS: max 4
  if (announceVideos.length + videos.length > 4) {
    alert("You can upload a maximum of 4 videos.");
    e.target.value = "";
    return;
  }

  handleMediaInputChange(
    e.target,
    "announcePreviewContainer",
    announceImages,
    announceVideos
  );
});

// Submit announcement
document.getElementById("announcePostBtn").onclick = async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("announceTitle").value.trim();
  const content = document.getElementById("announceMessage").value.trim();

  if (!title || !content)
    return alert("Please complete all fields.");

  const isEditing = window.currentEdit && window.currentEdit.type === "announcement";

  const url = isEditing
    ? `http://localhost:5000/api/announcements/${window.currentEdit.id}`
    : "http://localhost:5000/api/announcements";

  const method = isEditing ? "PUT" : "POST";

  const body = { title, content };

  // Only send media if it exists
  if (announceImages.length > 0) body.images = announceImages;
  if (announceVideos.length > 0) body.videos = announceVideos;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    showNotification(isEditing ? "Announcement updated!" : "Announcement posted!", "success");

    // Reset fields
    closeAnnouncementModal();
    document.getElementById("announceTitle").value = "";
    document.getElementById("announceMessage").value = "";
    document.getElementById("announceFileInput").value = "";

    announceImages.length = 0;
    announceVideos.length = 0;

    const preview = document.getElementById("announcePreviewContainer");
    preview.innerHTML = "";
    preview.style.display = "none";

    window.currentEdit = null;
    document.getElementById("announcePostBtn").textContent = "Post";

    loadHomeFeed();

  } catch (err) {
    console.error("ANNOUNCEMENT ERROR:", err);
    showNotification("❌ Failed to post announcement", "error");
  }
};


// =================================================
// Birthday greetings
// =================================================
async function loadBirthdayGreetings() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("birthdayFeed");
  if (!feed) return;
  if (!token) {
    feed.innerHTML = "<p>Please log in.</p>";
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/birthdays", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.length) {
      feed.innerHTML = "<p>No greetings yet 🎂</p>";
      return;
    }

    const typed = data.map(g => ({ type: "birthday", ...g }));
    window.currentFeedPosts = typed;
    feed.innerHTML = typed.map(renderPostHTML).join("");
    typed.forEach(p => loadLikeCount(p._id, p.type));

    attachEditButtons();
    attachDeleteButtons();
    attachLikeButtons();
    attachCommentButtons();

  } catch (err) {
    console.error(err);
    feed.innerHTML = "<p>Failed to load greetings.</p>";
  }
}

// birthday modal preview & submit
document.getElementById("birthdayImageIcon").addEventListener("click", () =>
  document.getElementById("birthdayFileInput").click()
);

document.getElementById("birthdayFileInput").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  const images = files.filter(f => f.type.startsWith("image/"));
  const videos = files.filter(f => f.type.startsWith("video/"));

  // 🧡 LIMIT IMAGES: max 20
  if (images.length + birthdayImages.length > 20) {
    alert("You can upload a maximum of 20 images only.");
    e.target.value = "";
    return;
  }

  // 💜 LIMIT VIDEOS: max 4
  if (videos.length + birthdayVideos.length > 4) {
    alert("You can upload a maximum of 4 videos only.");
    e.target.value = "";
    return;
  }

  handleMediaInputChange(
    e.target,
    "birthdayPreviewContainer",
    birthdayImages,
    birthdayVideos
  );
});



document.getElementById("birthdayPostBtn").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const recipientUsername = document.getElementById("birthdayRecipient").value.trim();
  const message = document.getElementById("birthdayPostMessage").value.trim();

  if (!recipientUsername || !message)
    return alert("Please complete all fields.");

  const isEditing = window.currentEdit && window.currentEdit.type === "birthday";

  const url = isEditing
    ? `http://localhost:5000/api/birthdays/${window.currentEdit.id}`
    : "http://localhost:5000/api/birthdays";

  const method = isEditing ? "PUT" : "POST";

  const hasNewMedia = birthdayImages.length > 0 || birthdayVideos.length > 0;

  const body = { recipientUsername, message };
  if (hasNewMedia) {
    body.images = birthdayImages;
    body.videos = birthdayVideos;
  }

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    showNotification(isEditing ? "Birthday post updated!" : "Birthday post created!", "success");

    closeBirthdayModal();

    document.getElementById("birthdayRecipient").value = "";
    document.getElementById("birthdayPostMessage").value = "";
    document.getElementById("birthdayFileInput").value = "";
    birthdayImages = [];
    birthdayVideos = [];

    const preview = document.getElementById("birthdayPreviewContainer");
    preview.innerHTML = "";
    preview.style.display = "none";

    window.currentEdit = null;
    document.getElementById("birthdayPostBtn").textContent = "Post";
    loadHomeFeed();

  } catch (err) {
    showNotification("❌ " + err.message, "error");
  }
});



// =================================================
// HOME POST (aggregated feed + create)
// =================================================
document.getElementById("homeImageIcon").addEventListener("click", () =>
  document.getElementById("homeFileInput").click()
);

document.getElementById("homeFileInput").addEventListener("change", (e) => {
  handleMediaInputChange(
    e.target,
    "homePreviewContainer",
    homeImages,
    homeVideos,
    { videoAsFile: true, imageAsFile: true } // 👈 both as File objects
  );
});


document.getElementById("homePostBtn").addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const content = document.getElementById("homePostMessage").value.trim();
  if (!content) return alert("Please write something.");

  const isEditing =
    window.currentEdit && window.currentEdit.type === "homepost";

  const url = isEditing
    ? `http://localhost:5000/api/homeposts/${window.currentEdit.id}`
    : "http://localhost:5000/api/homeposts";

  const method = isEditing ? "PUT" : "POST";

  // -----------------------------
  // USE FORMDATA INSTEAD OF JSON
  // -----------------------------
  const formData = new FormData();
  formData.append("content", content);

  // Append all IMAGES (base64) as one JSON field
  homeImages.forEach((imgFile) => {
    formData.append("image", imgFile);  // "image" matches multer field name
  });


  // Append ALL VIDEOS (raw file from input)
// Append ALL VIDEOS from homeVideos array (actual File objects)
homeVideos.forEach((vidFile) => {
  formData.append("video", vidFile); // multer will save it
});


  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`, // ❗ DO NOT SET Content-Type
      },
      body: formData,
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    showNotification(isEditing ? "Post updated!" : "Posted successfully!", "success");

    // Reset UI
    closeHomeModal();
    document.getElementById("homePostMessage").value = "";
    document.getElementById("homeFileInput").value = "";
    homeImages = [];
    homeVideos = [];
    document.getElementById("homePreviewContainer").innerHTML = "";
    document.getElementById("homePreviewContainer").style.display = "none";

    window.currentEdit = null;
    document.getElementById("homePostBtn").textContent = "Post";

    loadHomeFeed();
  } catch (err) {
    showNotification("❌ " + err.message, "error");
  }
});

// Load aggregated home feed
async function loadHomeFeed() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("homeFeed");
  if (!feed) return;
  if (!token) {
    feed.innerHTML = "<p>Please log in to view your feed.</p>";
    return;
  }

  try {
    const [homeRes, birthdaysRes, announcementsRes, newsRes, lostFoundRes] = await Promise.all([
      fetch("http://localhost:5000/api/homeposts", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/birthdays", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/announcements", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/news", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/lostfound", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const [homeposts, birthdays, announcements, news, lostfound] = await Promise.all([
      homeRes.json(),
      birthdaysRes.json(),
      announcementsRes.json(),
      newsRes.json(),
      lostFoundRes.json(),
    ]);

    const allPosts = [
      ...homeposts.map((p) => ({ type: "homepost", ...p })),
      ...birthdays.map((p) => ({ type: "birthday", ...p })),
      ...announcements.map((p) => ({ type: "announcement", ...p })),
      ...news.map((p) => ({ type: "news", ...p })),
      ...lostfound.map((p) => ({ type: "lostfound", ...p })),
    ];

    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allPosts.length === 0) {
      feed.innerHTML = "<p>No recent activity yet. Be the first to post! 🎉</p>";
      return;
    }

    window.currentFeedPosts = allPosts;
    feed.innerHTML = allPosts.map(post => renderPostHTML(post)).join("");
    allPosts.forEach(p => loadLikeCount(p._id, p.type));

    attachDeleteButtons();
    attachEditButtons();
    attachLikeButtons();
    attachCommentButtons();

  } catch (err) {
    console.error("Error loading home feed:", err);
    feed.innerHTML = "<p>Failed to load your feed. Please try again later.</p>";
  }
}

// ============================================
// MEDIA RENDER HELPERS
// ============================================
function getImagesFromPost(post) {
  if (Array.isArray(post.images) && post.images.length) return post.images;
  if (post.image) return [post.image];
  return [];
}

function getVideosFromPost(post) {
  if (Array.isArray(post.videos) && post.videos.length) return post.videos;
  return [];
}

function renderGallery(images, postId) {
  if (!images || !images.length) return "";

  const buildImg = (imgSrc, index, extraClass = "") =>
    `<img src="${imgSrc}"
          class="${extraClass} gallery-image"
          data-index="${index}"
          data-post="${postId}"
          data-images='${JSON.stringify(images)}'
    >`;

  if (images.length === 1) {
    return `
      <div class="gallery gallery-1">
        ${buildImg(images[0], 0)}
      </div>
    `;
  }

  if (images.length === 2) {
    return `
      <div class="gallery gallery-2">
        ${buildImg(images[0], 0)}
        ${buildImg(images[1], 1)}
      </div>
    `;
  }

  const extra = images.length - 3;

  return `
    <div class="gallery gallery-3">
      ${buildImg(images[0], 0, "big")}
      ${buildImg(images[1], 1, "small")}

      <div class="small more-wrapper">
        ${buildImg(images[2], 2)}
        ${extra > 0 ? `<div class="more-overlay">+${extra}</div>` : ""}
      </div>
    </div>
  `;
}

function renderMedia(post) {
  if (post.type === "homepost") {
    if (Array.isArray(post.images) && post.images.length > 0) {
      post.images = post.images.map(img => {
        if (img.startsWith("data:")) return img; // base64 already
        return `http://localhost:5000/${img.replace(/^\//, "")}`;
      });
    }
  }

  const images = getImagesFromPost(post);
  const videos = getVideosFromPost(post);

  let html = "";

  // IMAGES
  if (images.length) {
    html += renderGallery(images, post._id);

  }


// =========================
// VIDEOS (supports path OR base64)
// =========================
if (post.videos && post.videos.length > 0) {
  html += `<div class="video-list">`;

  post.videos.forEach((video) => {
    if (!video) return;

    let src = video;

    // If it's NOT a data: URL, treat it as a server path
    if (!video.startsWith("data:")) {
      const fixed = video.startsWith("/") ? video : "/" + video;
      src = `http://localhost:5000${fixed}`;
    }

    html += `
      <video class="post-video" controls>
        <source src="${src}" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    `;
  });

  html += `</div>`;
}



  return html;
}

// ===============================
// MAIN POST RENDERER
// ===============================
function renderPostHTML(post) {
  const date = new Date(post.createdAt).toLocaleString();
  const editDeleteHTML = getEditDeleteHTML(post);

  const getLabel = (type) => {
    switch (type) {
      case "homepost":    return `<div class="post-label home">HOME POST</div>`;
      case "birthday":    return `<div class="post-label birthday">BIRTHDAY GREETING</div>`;
      case "announcement":return `<div class="post-label announcement">ANNOUNCEMENT</div>`;
      case "news":        return `<div class="post-label news">SCHOOL NEWS</div>`;
      case "lostfound":   return `<div class="post-label lost">LOST / FOUND</div>`;
      default:            return "";
    }
  };

 


  const label = getLabel(post.type);

const interactionsHTML = (() => {
  const currentUser = window.loggedInUser || {};
  const isAdmin = currentUser.role === "admin" || currentUser.role === "headadmin";

  const ownerId =
    post.user?._id ||
    post.createdBy?._id ||
    post.recipient?._id;

  const isOwner = ownerId === currentUser._id;

  // Show REPORT only if:
  // - NOT admin
  // - NOT owner
  const showReport = !isAdmin && !isOwner;

  return `
    <div class="post-interactions">
      <div class="interaction-center">

        <button class="like-btn" data-id="${post._id}" data-type="${post.type}">
          ❤️ Like <span id="like-count-${post._id}">0</span>
        </button>

        <span class="pipe">|</span>

        <button class="comment-btn" data-id="${post._id}" data-type="${post.type}">
          💬 Comment
        </button>

        ${showReport ? `
          <span class="pipe">|</span>
          <button class="report-btn" data-id="${post._id}" data-type="${post.type}">
            ⚠️ Report
          </button>` : ""
        }

      </div>
    </div>

    <div class="comment-section" 
         id="comments-${post.type}-${post._id}" 
         style="display:none;">
      <div class="comments-list" id="comments-list-${post.type}-${post._id}"></div>

      <div class="comment-input">
        <input type="text" id="comment-input-${post.type}-${post._id}" placeholder="Write a comment...">
        <button onclick="submitComment('${post._id}', '${post.type}')">Send</button>
      </div>
    </div>
  `;
})();





  switch (post.type) {
    case "homepost":
      return `
        <div class="post-card post-home">
          ${post.inModal ? "" : `<div class="post-click-overlay" data-id="${post._id}" data-type="${post.type}"></div>`}
          ${label}
          <div class="birthday-post">
            <div class="birthday-header">
              <img src="${post.user?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
              <div>
                <h3>${post.user?.username} (${getFullName(post.user)})</h3>
                <span>${date}</span>
              </div>
              ${editDeleteHTML}
            </div>
            <div class="birthday-body">
              <p>${post.content}</p>
              ${renderMedia(post)}
            </div>
          </div>
          ${interactionsHTML}
        </div>
      `;

    case "birthday":
      return `
        <div class="post-card post-birthday">
          ${post.inModal ? "" : `<div class="post-click-overlay" data-id="${post._id}" data-type="${post.type}"></div>`}
          ${label}
          <div class="birthday-post">
            <div class="birthday-header">
              <img src="${post.createdBy?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
              <div>
                <h3>${post.createdBy?.username} (${getFullName(post.createdBy)})</h3>
                <span>${date}</span>
              </div>
              ${editDeleteHTML}
            </div>
            <div class="birthday-body">
              <p><b>🎉 @${post.recipient?.username}</b></p>
              <p>${post.message}</p>
              ${renderMedia(post)}
            </div>
          </div>
          ${interactionsHTML}
        </div>
      `;

    case "announcement":
      return `
        <div class="post-card post-announcement">
          ${post.inModal ? "" : `<div class="post-click-overlay" data-id="${post._id}" data-type="${post.type}"></div>`}
          ${label}
          <div class="birthday-post">
            <div class="birthday-header">
              <img src="${post.createdBy?.avatar || 'announce.png'}" class="birthday-avatar">
              <div>
                <h3>${post.createdBy?.username || "Admin"} ${post.createdBy ? `(${getFullName(post.createdBy)})` : ""}</h3>
                <span>${date}</span>
              </div>
              ${editDeleteHTML}
            </div>
            <div class="birthday-body">
              <h3>📢 ${post.title}</h3>
              <p>${post.content}</p>
              ${renderMedia(post)}
            </div>
          </div>
          ${interactionsHTML}
        </div>
      `;

    case "news":
      return `
        <div class="post-card post-news">
          ${post.inModal ? "" : `<div class="post-click-overlay" data-id="${post._id}" data-type="${post.type}"></div>`}
          ${label}
          <div class="birthday-post">
            <div class="birthday-header">
              <img src="${post.createdBy?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
              <div>
                <h3>${post.createdBy?.username} (${getFullName(post.createdBy)})</h3>
                <span>${date}</span>
              </div>
              ${editDeleteHTML}
            </div>
            <div class="birthday-body">
              <h3>📰 ${post.title}</h3>
              <p>${post.content}</p>
              ${renderMedia(post)}
            </div>
          </div>
          ${interactionsHTML}
        </div>
      `;

    case "lostfound":
      return `
        <div class="post-card post-lostfound">
          ${post.inModal ? "" : `<div class="post-click-overlay" data-id="${post._id}" data-type="${post.type}"></div>`}
          ${label}
          <div class="birthday-post">
            <div class="birthday-header">
              <img src="${post.user?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
              <div>
                <h3>${post.user?.username} (${getFullName(post.user)})</h3>
                <span>${date}</span>
              </div>
              ${editDeleteHTML}
            </div>
            <div class="birthday-body">
              <h3>${post.title}</h3>
              <p><b>Status:</b> ${post.status === "found" ? "📦 Found" : "🔎 Lost"}</p>
              <p>${post.description}</p>
              ${renderMedia(post)}
            </div>
          </div>
          ${interactionsHTML}
        </div>
      `;

    default:
      return "";
  }
}

// =========================
// Simple notification popup
// =========================
function showNotification(message, type = "info") {
  const existing = document.querySelector(".popup-notif");
  if (existing) existing.remove();

  const notif = document.createElement("div");
  notif.className = `popup-notif ${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.classList.add("show"), 10);
  setTimeout(() => {
    notif.classList.remove("show");
    setTimeout(() => notif.remove(), 500);
  }, 3000);
}

// =========================
// Dropdowns & Logout
// =========================
// =========================
// NAVBAR DROPDOWNS & MESSAGE
// =========================
const profileIcon = document.getElementById("profileIcon");
const navUserProfile = document.getElementById("navUserProfile");
const profileDropdown = document.getElementById("profileDropdown");

const notifIcon = document.getElementById("notifIcon");
const notifDropdown = document.getElementById("notifDropdown");

const msgIcon = document.getElementById("msgIcon");
const msgBadge = document.getElementById("msgBadge");

function closeAllDropdowns() {
  if (profileDropdown) profileDropdown.classList.remove("active");
  if (notifDropdown) notifDropdown.classList.remove("active");
}

function toggleDropdown(dropdown) {
  if (!dropdown) return;
  const isOpen = dropdown.classList.contains("active");
  closeAllDropdowns();
  if (!isOpen) dropdown.classList.add("active");
}

// PROFILE DROPDOWN (click avatar OR entire nav-user-info)
[profileIcon, navUserProfile].forEach(el => {
  if (!el) return;
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown(profileDropdown);
  });
});

// NOTIFICATION DROPDOWN
if (notifIcon) {
  notifIcon.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown(notifDropdown);

    // Safely call markNotificationsAsRead if it exists
    if (typeof markNotificationsAsRead === "function") {
      markNotificationsAsRead();
    }
  });
}

// CLICK OUTSIDE → CLOSE DROPDOWNS
document.addEventListener("click", (e) => {
  // if click is inside profile or notif dropdown, do nothing
  if (
    (profileDropdown && profileDropdown.contains(e.target)) ||
    (notifDropdown && notifDropdown.contains(e.target))
  ) {
    return;
  }
  closeAllDropdowns();
});

// MESSAGE ICON (NO DROPDOWN, JUST REDIRECT + RESET BADGE)
if (msgIcon) {
  msgIcon.addEventListener("click", () => {
    if (msgBadge) {
      msgBadge.textContent = "0";
      msgBadge.style.display = "none";
    }
    window.location.href = "../Mess1/Message/message.html";
  });
}


// LOGOUT
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const token = localStorage.getItem("token");
  if (!token) return;

  if (logoutBtn)
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      } catch { }
      localStorage.clear();
      window.location.href = "../../Login/index.html";
    });
});

// =========================
// DELETE HANDLER
// =========================
function deletePost(type, id) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first.");

  const urlMap = {
    homepost: `http://localhost:5000/api/homeposts/${id}`,
    birthday: `http://localhost:5000/api/birthdays/${id}`,
    announcement: `http://localhost:5000/api/announcements/${id}`,
    news: `http://localhost:5000/api/news/${id}`,
    lostfound: `http://localhost:5000/api/lostfound/${id}`
  };

  fetch(urlMap[type], {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(r => r.json().catch(() => ({})))
    .then(res => {
      showNotification("Deleted successfully!", "success");
      loadHomeFeed();
      switch (type) {
        case "birthday":     loadBirthdayGreetings(); break;
        case "announcement": loadAnnouncements();     break;
        case "news":         loadSchoolNews();        break;
        case "lostfound":    loadLostItems();         break;
      }
    })
    .catch(err => showNotification(err.message, "error"));
}



function attachDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      if (!confirm("Delete this post?")) return;
      deletePost(btn.dataset.type, btn.dataset.id);
    };
  });
}

// =========================
// EDIT HANDLER
// =========================
function attachEditButtons() {
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const type = btn.dataset.type;

      window.currentEdit = { id, type };

      const post = (window.currentFeedPosts || []).find(p => p._id === id && p.type === type);
      if (!post) return;

      switch (type) {
        case "homepost":
          openHomeModal();
          document.getElementById("homePostBtn").textContent = "Save Changes";
          document.getElementById("homePostMessage").value = post.content || "";
          break;

        case "birthday":
          openBirthdayModal();
          document.getElementById("birthdayPostBtn").textContent = "Save Changes";
          document.getElementById("birthdayRecipient").value = post.recipient?.username || "";
          document.getElementById("birthdayPostMessage").value = post.message || "";
          break;

        case "announcement":
          openAnnouncementModal();
          document.getElementById("announcePostBtn").textContent = "Save Changes";
          document.getElementById("announceTitle").value = post.title || "";
          document.getElementById("announceMessage").value = post.content || "";
          break;

        case "news":
          openNewsModal();
          document.getElementById("newsPostBtn").textContent = "Save Changes";
          document.getElementById("newsTitleInput").value = post.title || "";
          document.getElementById("newsPostMessage").value = post.content || "";
          break;

        case "lostfound":
          openLostModal();
          document.getElementById("lostPostBtn").textContent = "Save Changes";
          document.getElementById("lostTitleInput").value = post.title || "";
          document.getElementById("lostPostMessage").value = post.description || "";
          document.getElementById("lostStatusSelect").value = post.status || "lost";
          break;
      }
    };
  });
}

// =========================
// LIKE HANDLER (works for feed + modal)
// =========================
function attachLikeButtons() {
  document.querySelectorAll(".like-btn").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();

      const id = btn.dataset.id;
      const type = btn.dataset.type;

      console.log("[LIKE CLICK]", id, type);

      await handleLike(id, type); // uses your existing handleLike()
    };
  });
}


async function loadLikeCount(postId, postType) {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch(
      `http://localhost:5000/api/likes?postId=${postId}&postType=${postType}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const likes = await res.json();

    const span = document.getElementById(`like-count-${postId}`);
    if (span) span.textContent = likes.length;

  } catch (err) {
    console.error("Error loading like count:", err);
  }
}

// =========================================================
// 🔥 HANDLE LIKE (used by delegated listener)
// =========================================================
async function handleLike(id, type) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first.");

  try {
    const res = await fetch("http://localhost:5000/api/likes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ postId: id, postType: type }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.message || "Failed to like post");

    loadLikeCount(id, type);

  } catch (err) {
    console.error("LIKE ERROR:", err);
    alert("Error liking post");
  }
}


// =========================
// COMMENT BUTTON HANDLER (feed + modal)
// =========================
function attachCommentButtons() {
  document.querySelectorAll(".comment-btn").forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();

      const id = btn.dataset.id;
      const type = btn.dataset.type;

      console.log("[COMMENT TOGGLE]", id, type);

      const section = document.getElementById(`comments-${type}-${id}`);
      if (!section) return;

      // First time: load comments
      if (!section.dataset.loaded) {
        await loadComments(id, type, section);
        section.dataset.loaded = "1";
        section.style.display = "block";
        return;
      }

      // Next times: just toggle visibility
      section.style.display =
        section.style.display === "none" || !section.style.display
          ? "block"
          : "none";
    };
  });
}


async function loadComments(postId, postType, container) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in to view comments.");
    return;
  }

  try {
    // 🔥 FIXED — fetch comments from API using correct params
    const res = await fetch(
      `http://localhost:5000/api/comments?postId=${postId}&postType=${postType}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const comments = await res.json();
    if (!res.ok) {
      console.error("Comment fetch error:", comments);
      alert("Failed to load comments");
      return;
    }

    // 🔥 FIXED — find list container by unique ID
    const listContainer = document.getElementById(`comments-list-${postType}-${postId}`);
    if (!listContainer) {
      console.error("Comment list container missing:", `comments-list-${postType}-${postId}`);
      return;
    }

    // Render comments
    listContainer.innerHTML = comments
      .map(c => `
        <div class="comment-item">
          <img class="comment-avatar" src="${c.user?.avatar || 'final_icon-removebg-preview.png'}">
          <div>
            <b>${c.user?.username}</b>
            <p>${c.content}</p>
          </div>
        </div>
      `)
      .join("");

  } catch (err) {
    console.error("Comment load error:", err);
    alert("Error loading comments");
  }
}


async function submitComment(postId, postType) {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first.");

  const input = document.getElementById(`comment-input-${postType}-${postId}`);
  if (!input) {
    console.error("Comment input not found:", `comment-input-${postType}-${postId}`);
    return;
  }

  const content = input.value.trim();
  if (!content) return;

  try {
    const res = await fetch("http://localhost:5000/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ postId, postType, content })
    });

    const comment = await res.json();
    if (!res.ok) {
      console.error("Submit comment error:", comment);
      return alert(comment.message || "Failed to post comment");
    }

    // INSERT comment into the proper list
    const listContainer = document.getElementById(`comments-list-${postType}-${postId}`);
    if (listContainer) {
      listContainer.insertAdjacentHTML(
        "afterbegin",
        `
        <div class="comment-item">
          <img class="comment-avatar" src="${comment.user?.avatar || 'final_icon-removebg-preview.png'}">
          <div>
            <b>${comment.user?.username}</b>
            <p>${comment.content}</p>
          </div>
        </div>
        `
      );
    }

    input.value = "";

  } catch (err) {
    console.error("Submit comment error:", err);
    alert("Error posting comment");
  }
}


// =========================
// NOTIFICATIONS
// =========================
  const notifIconA = document.getElementById("notifIcon");
  const notifDropdownA = document.getElementById("notifDropdown");
  const notifBadgeA = document.getElementById("notifBadge");

  notifIconA.addEventListener("click", () => {
    notifDropdownA.style.display =
      notifDropdownA.style.display === "block" ? "none" : "block";

    notifBadgeA.style.display = "none";
  });

  document.addEventListener("click", (e) => {
    if (!notifDropdownA.contains(e.target) && e.target !== notifIconA) {
      notifDropdownA.style.display = "none";
    }
  });

  function setNotifBadge(count) {
    if (count > 0) {
      notifBadgeA.style.display = "inline-block";
      notifBadgeA.textContent = count;
    } else {
      notifBadgeA.style.display = "none";
    }
  }

async function loadNotificationsA() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const items = await res.json();

    notifDropdownA.innerHTML = "";
    let unreadCount = 0;

    notifDropdownA.innerHTML = `
      <div class="notif-header">
        <span>Notifications</span>
        <button id="markAllReadBtn">Mark all as read</button>
      </div>
    `;

    const markBtn = document.getElementById("markAllReadBtn");
    if (markBtn) {
      markBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        await markNotificationsAsRead();
      });
    }

    items.forEach((n) => {
      const div = document.createElement("div");
      div.className = "notif-item " + (!n.isRead ? "unread" : "");

      if (!n.isRead) unreadCount++;

      const avatar =
        n.sender?.avatar || "final_icon-removebg-preview.png";

      div.innerHTML = `
        <img src="${avatar}" class="notif-avatar">
        <div class="notif-body">
          <div class="notif-main"><b>${n.sender?.username}</b> ${n.message}</div>
          <div class="notif-preview">${(n.postPreview || "").slice(0, 60)}</div>
          <div class="notif-ts">${new Date(n.createdAt).toLocaleString()}</div>
        </div>
      `;

      div.addEventListener("click", () => {
        notifDropdownA.style.display = "none";
        if (n.postId && n.postType) {
          openPostModal(n.postId, n.postType);
        }
      });

      notifDropdownA.appendChild(div);
    });

    setNotifBadge(unreadCount);
  } catch (err) {
    console.error("❌ Notification Error:", err);
  }
}

async function markNotificationsAsRead() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    await fetch("http://localhost:5000/api/notifications/mark-read", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });

    setNotifBadge(0);

    document
      .querySelectorAll(".notif-item.unread")
      .forEach((el) => el.classList.remove("unread"));
  } catch (err) {
    console.error("❌ Failed to mark notifications as read:", err);
  }
}

loadNotificationsA();

// ===============================
// OPEN POST MODAL (WITH LIKE + COMMENTS)
// ===============================
async function openPostModal(id, type) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    return;
  }

  const routes = {
    homepost:    `http://localhost:5000/api/homeposts/${id}`,
    birthday:    `http://localhost:5000/api/birthdays/${id}`,
    announcement:`http://localhost:5000/api/announcements/${id}`,
    news:        `http://localhost:5000/api/news/${id}`,
    lostfound:   `http://localhost:5000/api/lostfound/${id}`,
  };

  try {
    const url = routes[type];
    if (!url) {
      console.error("Unknown post type in modal:", type);
      alert("Unknown post type.");
      return;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const post = await res.json();
    if (!res.ok) {
      console.error("Modal fetch error:", post);
      alert(post.message || "Failed to load post");
      return;
    }

    // Normalize structure for renderPostHTML
    const normalized = {
      ...post,
      type,          // make sure post.type exists
      inModal: true, // so overlay is NOT added inside modal
    };

    // Put post HTML into the modal container
    viewPostContainer.innerHTML = renderPostHTML(normalized);

    // Like count (use post._id if available, else use id)
    const realId = normalized._id || id;
    loadLikeCount(realId, type);

    // Load comments directly inside modal
    const commentSection = document.getElementById(`comments-${realId}`);
    if (commentSection) {
      await loadComments(realId, type, commentSection);
      commentSection.dataset.loaded = "1";
      commentSection.style.display = "block";
    }

    // VERY IMPORTANT: reattach button handlers for elements inside modal
    setTimeout(() => {
      attachLikeButtons();
      attachCommentButtons();
      attachEditButtons && attachEditButtons();
      attachDeleteButtons && attachDeleteButtons();
    }, 0);

    // Finally open the modal
    openViewPostModal();

  } catch (err) {
    console.error("Error loading post in modal:", err);
    alert("Error loading post");
  }
}





// ===============================
// CLICK ON POST → OPEN MODAL
// ===============================
document.addEventListener("click", (e) => {
  const overlay = e.target.closest(".post-click-overlay");
  if (!overlay) return;

  const id = overlay.dataset.id;
  const type = overlay.dataset.type;

  if (!id || !type) return;
  openPostModal(id, type);
});

// ===============================
// IMAGE CLICK → VIEWER POPUP
// ===============================
document.addEventListener("click", (e) => {
  const img = e.target.closest(".gallery img");
  if (!img) return;

  // Open viewer
  const viewer = document.getElementById("imageViewer");
  const viewerImg = document.getElementById("imageViewerImg");

  viewerImg.src = img.src;
  viewer.classList.add("active");
});

// Close viewer
document.querySelector(".image-viewer-close").addEventListener("click", () => {
  document.getElementById("imageViewer").classList.remove("active");
});

// Close when clicking dark background
document.getElementById("imageViewer").addEventListener("click", (e) => {
  if (e.target.id === "imageViewer")
    e.target.classList.remove("active");
});



// Prevent overlay clicks from interfering with modal buttons
document.addEventListener("click", (e) => {
  if (
    e.target.closest(".like-btn") ||
    e.target.closest(".comment-btn")
  ) {
    e.stopPropagation();
  }
});

// =====================================================
// FULLSCREEN IMAGE VIEWER + SWIPE LEFT/RIGHT
// =====================================================

let currentImages = [];
let currentIndex = 0;

const viewer = document.getElementById("imageViewer");
const viewerImg = document.getElementById("imageViewerImg");
const viewerPrev = document.getElementById("viewerPrev");
const viewerNext = document.getElementById("viewerNext");

// Open viewer when image clicked
document.addEventListener("click", (e) => {
  const img = e.target.closest(".gallery-image");
  if (!img) return;

  currentImages = JSON.parse(img.dataset.images);
  currentIndex = parseInt(img.dataset.index);

  viewerImg.src = currentImages[currentIndex];
  viewer.classList.add("active");
});

function showImage(index) {
  if (index < 0 || index >= currentImages.length) return;
  currentIndex = index;
  viewerImg.src = currentImages[currentIndex];
}

// Arrows
viewerPrev.addEventListener("click", () => showImage(currentIndex - 1));
viewerNext.addEventListener("click", () => showImage(currentIndex + 1));

// Click background to close
viewer.addEventListener("click", (e) => {
  if (e.target.id === "imageViewer") {
    viewer.classList.remove("active");
  }
});

// Close button
document.querySelector(".image-viewer-close").addEventListener("click", () => {
  viewer.classList.remove("active");
});

// Keyboard support
document.addEventListener("keydown", (e) => {
  if (!viewer.classList.contains("active")) return;

  if (e.key === "ArrowRight") showImage(currentIndex + 1);
  if (e.key === "ArrowLeft") showImage(currentIndex - 1);
  if (e.key === "Escape") viewer.classList.remove("active");
});

// Swipe support (mobile)
let touchStart = 0;

viewer.addEventListener("touchstart", e => {
  touchStart = e.touches[0].clientX;
});

viewer.addEventListener("touchend", e => {
  const end = e.changedTouches[0].clientX;
  const diff = end - touchStart;

  if (Math.abs(diff) > 50) {
    if (diff < 0) showImage(currentIndex + 1);
    else showImage(currentIndex - 1);
  }
});


// ======================================
// 🔍 USER SEARCH SYSTEM
// ======================================
const searchInput = document.getElementById("userSearchInput");
const searchResults = document.getElementById("searchResults");

if (searchInput) {
  searchInput.addEventListener("input", async () => {
    const query = searchInput.value.trim();
    
    if (query.length === 0) {
      searchResults.style.display = "none";
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const users = await res.json();
      if (!Array.isArray(users)) return;

      if (users.length === 0) {
        searchResults.innerHTML = `<p style="padding: 10px; color: gray;">No users found</p>`;
        searchResults.style.display = "block";
        return;
      }

      // Build dropdown
      searchResults.innerHTML = users
        .map(u => `
          <div class="search-result-item" data-id="${u._id || u.id || u.userId}">
            <img src="${u.avatar || 'final_icon-removebg-preview.png'}">
            <div>
              <div class="name">${u.firstName} ${u.lastName}</div>
              <div class="username">@${u.username}</div>
            </div>
          </div>
        `)
        .join("");

      searchResults.style.display = "block";

      // Click handler → jump to profile
      document.querySelectorAll(".search-result-item").forEach(item => {
        item.addEventListener("click", () => {
          const id = item.dataset.id;
          window.location.href = `../Profile/profile.html?userId=${id}`;
        });
      });

    } catch (err) {
      console.error("Search error:", err);
    }
  });
}

// =================================================
// REAL-TIME SOCKET NOTIFICATION LISTENER
// =================================================
const socket = io("http://localhost:5000");

// register user
setTimeout(() => {
  if (window.loggedInUser?._id) {
    socket.emit("register_user", window.loggedInUser._id);
  }
}, 1000);

// ================================
// WHEN REAL-TIME MESSAGE ARRIVES
// ================================
socket.on("receive_message_notification", (data) => {

    const msgDropdown = document.getElementById("msgDropdown");
    const msgBadge = document.getElementById("msgBadge");

    // Update dropdown preview
    msgDropdown.innerHTML = `
        <div style="padding:10px; display:flex; gap:12px;">
            <img src="${data.senderAvatar}" style="width:40px; height:40px; border-radius:50%;">
            <div>
                <b>${data.senderName}</b><br>
                <span>${data.message}</span>
            </div>
        </div>
        <a class="see-all-msg" id="notifMsgGoTo">Open conversation</a>
    `;

    msgDropdown.style.display = "block";

    // 🔥 SHOW / UPDATE MESSAGE BADGE
    let count = parseInt(msgBadge.textContent) || 0;
    msgBadge.textContent = count + 1;
    msgBadge.style.display = "inline-block";

    // RESET badge when clicking "Open conversation"
    document.getElementById("notifMsgGoTo").onclick = () => {
        msgBadge.style.display = "none";
        window.location.href = `../Mess1/Message/message.html?conv=${data.convId}`;
    };
});

socket.on("receive_message_notification", (data) => {

    const msgBadge = document.getElementById("msgBadge");

    // Increment badge count
    let count = parseInt(msgBadge.textContent) || 0;
    msgBadge.textContent = count + 1;

    // Show badge
    msgBadge.style.display = "inline-block";
});


// Close dropdown when clicking outside
document.addEventListener("click", e => {
  if (!searchResults.contains(e.target) && e.target !== searchInput) {
    searchResults.style.display = "none";
  }
});

// =========================
// REPORT HANDLER
// =========================
function attachReportButtons() {
  document.querySelectorAll(".report-btn").forEach(btn => {
    btn.onclick = () => {
      const postId = btn.dataset.id;
      const postType = btn.dataset.type;

      const reason = prompt(
        "Please explain why you are reporting this post:"
      );

      if (!reason || !reason.trim()) return;

      submitReport(postId, postType, reason.trim());
    };
  });
}

async function submitReport(postId, postType, reason) {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please log in first.");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/reports", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        postId,
        postType,
        reason
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Failed to submit report");
    }

    alert("✅ Report submitted successfully.");
  } catch (err) {
    console.error("Report error:", err);
    alert("❌ Failed to submit report.");
  }
}
// ===============================
// REPORT POST (USER SIDE)
// ===============================
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".report-btn");
  if (!btn) return;

  const postId = btn.dataset.id;
  const postType = btn.dataset.type;

  const reason = prompt("Why are you reporting this post?");
  if (!reason) return;

  try {
    const res = await fetch(`${API_BASE}/api/reports`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        postId,
        postType,
        reason,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to report");

    alert("✅ Report submitted. Thank you.");
  } catch (err) {
    console.error("Report error:", err);
    alert(err.message || "Failed to submit report");
  }
});
