// ===============================
// DETECT VISITING ANOTHER USER
// ===============================
const params = new URLSearchParams(window.location.search);

let visitingUserId = null;

// Try all param names dynamically
for (const [key, value] of params.entries()) {
  const lower = key.toLowerCase();
  if (
    lower.includes("id") ||
    lower.includes("user") ||
    lower.includes("profile")
  ) {
    visitingUserId = value;
    break;
  }
}

// FINAL STRONG FALLBACK
if (!visitingUserId || visitingUserId === "undefined" || visitingUserId === "") {
  visitingUserId =
    params.get("userId") ||
    params.get("userid") ||
    params.get("id") ||
    null;
}

console.log("Detected visitingUserId =", visitingUserId);




// ===============================
// NAVBAR DROPDOWNS
// ===============================
const profileIcon = document.getElementById("profileIcon");
const dropdown = document.getElementById("profileDropdown");
const msgIcon = document.getElementById("msgIcon");
const notifIcon = document.getElementById("notifIcon");
const msgDropdown = document.getElementById("msgDropdown");
const notifDropdown = document.getElementById("notifDropdown");

// =========================
// NAVBAR USER LOADER (PROFILE PAGE)
// =========================
function getFullName(user) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
}

async function loadNavbarProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await res.json();
    if (!res.ok) throw new Error(user.message || "Failed to load profile");

    // NAV ELEMENTS
    const profileIcon = document.getElementById("profileIcon");
    const navUsername = document.getElementById("navUsername");
    const navRoleTag = document.getElementById("navRoleTag");
    const navDeptTag = document.getElementById("navDeptTag");
    const navDepartment = document.getElementById("navDepartment");

    if (profileIcon) {
      profileIcon.src = user.avatar || "final_icon-removebg-preview.png";
    }

    if (navUsername) {
      navUsername.textContent = getFullName(user) || user.username || "User";
    }

    if (navRoleTag) {
      navRoleTag.textContent = (user.role || "user").toUpperCase();
      navRoleTag.className = `nav-tag role-${user.role || "user"}`;
    }

    if (navDeptTag) {
      const dept = (user.department || "N/A").toUpperCase();
      navDeptTag.textContent = dept;
      navDeptTag.className = `nav-tag dept-${(user.department || "na").toLowerCase()}`;
    }

    if (navDepartment) {
      navDepartment.textContent = user.department ? `(${user.department})` : "";
    }

  } catch (err) {
    console.error("⚠️ Failed to load navbar user on profile page:", err);
  }
}

// Run this when the page is ready
document.addEventListener("DOMContentLoaded", () => {
  loadNavbarProfile();
});



function closeAll() {
  dropdown.classList.remove("active");
  msgDropdown.classList.remove("active");
  notifDropdown.classList.remove("active");
}

profileIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = dropdown.classList.contains("active");
  closeAll();
  if (!open) dropdown.classList.add("active");
});

msgIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAll();
  msgDropdown.classList.add("active");
});

notifIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  closeAll();
  notifDropdown.classList.add("active");
});


document.addEventListener("click", () => closeAll());

// ===============================
// EDIT PROFILE MODAL
// ===============================
const editBtn = document.querySelector(".edit-btn");
const editModal = document.getElementById("editModal");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const usernameDisplay = document.querySelector(".info h2");
const avatarDisplay = document.querySelector(".avatar");
const profilePicInput = document.getElementById("profilePicInput");

editBtn.addEventListener("click", () => editModal.classList.add("active"));
cancelBtn.addEventListener("click", () => editModal.classList.remove("active"));

// ===============================
// SAVE PROFILE CHANGES
// ===============================
saveBtn.addEventListener("click", async () => {
  const newName = document.getElementById("usernameInput").value.trim();
  const newBio = document.getElementById("bioInput").value.trim();
  const newPassword = document.getElementById("passwordInput").value.trim();
  const token = localStorage.getItem("token");

  if (!token) return window.location.href = "../../Login/index.html";

  try {
    const res = await fetch("http://localhost:5000/api/profile/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: newName || undefined,
        bio: newBio || undefined,
        password: newPassword || undefined,
      }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    usernameDisplay.textContent = `${result.user.username} (${result.user.firstName} ${result.user.lastName})`;
    updateBio(result.user.bio);

    editModal.classList.remove("active");
    alert("Profile updated successfully!");
  } catch (err) {
    alert("Update failed: " + err.message);
  }
});

// Update Bio
function updateBio(bioText) {
  let bioPara = document.querySelector(".user-bio");
  if (!bioPara) {
    bioPara = document.createElement("p");
    bioPara.classList.add("user-bio");
    document.querySelector(".info").appendChild(bioPara);
  }
  bioPara.textContent = bioText || "";
}

// ===============================
// CHANGE PROFILE PICTURE
// ===============================
avatarDisplay.addEventListener("click", () => {
  if (!visitingUserId) profilePicInput.click();
});

profilePicInput.addEventListener("change", async () => {
  const file = profilePicInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    const token = localStorage.getItem("token");

    const res = await fetch("http://localhost:5000/api/profile/avatar", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ avatar: base64 }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Avatar upload failed");

    avatarDisplay.src = data.user.avatar;
    document.getElementById("profileIcon").src = data.user.avatar;
  };

  reader.readAsDataURL(file);
});

// ====================================================
// 🎯 APPLY PROFILE DATA (Role/Department tags included)
// ====================================================
function applyProfileData(user) {
  if (!user) return;

  // Avatar
  document.querySelector(".avatar").src =
    user.avatar || "/frontend/images/avatar.png";

  // Full name
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  document.querySelector(".info h2").textContent =
    `${user.username || "Unknown"} (${fullName || "No Name"})`;

  // ROLE TAG
  const roleEl = document.getElementById("profileRoleTag");
  if (roleEl) {
    roleEl.textContent = (user.role || "student").toUpperCase();
    roleEl.className = `nav-tag role-${user.role || "student"}`;
  }

  // DEPARTMENT TAG
  const deptEl = document.getElementById("profileDeptTag");
  if (deptEl) {
    deptEl.textContent = (user.department || "CITE").toUpperCase();
    deptEl.className = `nav-tag dept-${(user.department || "CITE").toLowerCase()}`;
  }
}


// ===============================
// LOAD PROFILE (OWNER OR VISITED)
// ===============================
async function loadProfile() {
  const token = localStorage.getItem("token");
  if (!token) return window.location.href = "../Login/index.html";

  if (visitingUserId) return loadOtherProfile();

  try {
    const res = await fetch("http://localhost:5000/api/profile/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const user = await res.json();

    applyProfileData(user);

    window.currentUserId = user._id;
    loadMyPosts();

  } catch (err) {
    console.error("Error loading own profile:", err);
  }
}

// ===============================
// LOAD OTHER USER PROFILE
// ===============================
async function loadOtherProfile() {
  try {
    const res = await fetch(`http://localhost:5000/api/users/${visitingUserId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const user = await res.json();
    if (!res.ok) {
      alert("User not found");
      return;
    }

    applyProfileData(user);

    // Disable editing for visited profile
    document.querySelector(".edit-btn").style.display = "none";
    document.querySelector(".avatar-overlay").style.display = "none";

    // Load posts for that user
    loadUserPosts(visitingUserId);

  } catch (err) {
    console.error("Error loading other's profile:", err);
  }
}



// ===========================================
// RENDER MEDIA (images + videos)
// ===========================================
function getImages(post) {
  if (Array.isArray(post.images) && post.images.length) return post.images;
  if (post.image) return [post.image];
  return [];
}

function getVideos(post) {
  return Array.isArray(post.videos) ? post.videos : [];
}

function renderGallery(images) {
  if (images.length === 1)
    return `<div class="gallery gallery-1"><img src="${images[0]}"></div>`;

  if (images.length === 2)
    return `<div class="gallery gallery-2">
      <img src="${images[0]}"><img src="${images[1]}">
    </div>`;

  const extra = images.length - 3;
  return `
    <div class="gallery gallery-3">
      <img src="${images[0]}" class="big">
      <img src="${images[1]}" class="small">
      <div class="small more-wrapper">
        <img src="${images[2]}">
        ${extra > 0 ? `<div class="more-overlay">+${extra}</div>` : ""}
      </div>
    </div>
  `;
}

function renderMedia(post) {
  const imgs = getImages(post);
  const vids = getVideos(post);

  return `
    ${imgs.length ? renderGallery(imgs) : ""}
    ${
      vids.length
        ? vids
            .map(
              (v) => `
      <video class="post-video" controls>
        <source src="${v}">
      </video>`
            )
            .join("")
        : ""
    }
  `;
}

// ===========================================
// RENDER PROFILE POST
// ===========================================
function renderProfilePost(post) {
  const owner = post.user || post.createdBy;
  const fullName = `${owner?.firstName || ""} ${owner?.lastName || ""}`.trim();

  const date = new Date(post.createdAt).toLocaleString();

  let labelClass = "";
  let labelText = "";
  let title = "";
  let body = "";

  switch (post.type) {
    case "homepost":
      labelClass = "post-label-home";
      labelText = "HOME POST";
      body = post.content;
      break;
    case "birthday":
      labelClass = "post-label-birthday";
      labelText = "BIRTHDAY GREETING";
      title = `🎉 @${post.recipient?.username}`;
      body = post.message;
      break;
    case "announcement":
      labelClass = "post-label-announcement";
      labelText = "ANNOUNCEMENT";
      title = post.title;
      body = post.content;
      break;
    case "news":
      labelClass = "post-label-news";
      labelText = "SCHOOL NEWS";
      title = post.title;
      body = post.content;
      break;
    case "lostfound":
      labelClass = "post-label-lostfound";
      labelText = "LOST / FOUND";
      title = post.title;
      body = `${post.status === "found" ? "📦 Found" : "🔎 Lost"} — ${
        post.description || ""
      }`;
      break;
  }

  return `
    <div class="profile-post-card">
      <div class="post-label ${labelClass}">${labelText}</div>
      <div class="post-header">
        <div>
          <div class="post-owner">${owner?.username} (${fullName})</div>
          <div class="post-meta">${date}</div>
        </div>
      </div>
      <div class="post-body">
        ${title ? `<div class="post-title">${title}</div>` : ""}
        <div class="post-content">${body}</div>
        ${renderMedia(post)}
      </div>
    </div>
  `;
}

// ===========================================
// LOAD MY POSTS
// ===========================================
async function loadMyPosts() {
  loadPostsByUser(window.currentUserId, true);
}

// ===========================================
// LOAD VISITED USER POSTS
// ===========================================
async function loadUserPosts(userId) {
  loadPostsByUser(userId, false);
}

// ===========================================
// GENERIC POST LOADER
// ===========================================
async function loadPostsByUser(userId, isOwner) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("profilePosts");
  container.innerHTML = "Loading posts...";

  try {
    const endpoints = [
      "homeposts",
      "birthdays",
      "announcements",
      "news",
      "lostfound",
    ];

    let posts = [];

    for (let ep of endpoints) {
      const res = await fetch(`http://localhost:5000/api/${ep}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      posts.push(...data.map((p) => ({ type: ep.slice(0, -1), ...p })));
    }

    posts = posts.filter((p) => {
      const ownerId = p.user?._id || p.createdBy?._id;
      return ownerId === userId;
    });

    posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!posts.length) {
      container.innerHTML = isOwner
        ? "<p>You haven't posted anything yet.</p>"
        : "<p>No posts found.</p>";
      return;
    }

    container.innerHTML = posts.map(renderProfilePost).join("");
  } catch (err) {
    container.innerHTML = "<p>Error loading posts.</p>";
  }
}

// ===============================
// INIT
// ===============================
window.onload = loadProfile;