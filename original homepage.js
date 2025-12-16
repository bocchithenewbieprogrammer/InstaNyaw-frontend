// === MAIN ELEMENTS ===
const mainCenter = document.getElementById("mainCenter");
const modal = document.getElementById("createPostModal");

// === MODAL ===
function openModal() { modal.classList.add("active"); }
function closeModal() { modal.classList.remove("active"); }

// === LOAD USER PROFILE INTO NAVBAR ===
async function loadUserProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("http://localhost:5000/api/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const user = await res.json();
    if (!res.ok) throw new Error(user.message);

    // Update header and dropdown
    const profileIcon = document.getElementById("profileIcon");
    const navUsernameHeader = document.getElementById("navUsernameHeader");
    const navUserAvatar = document.getElementById("navUserAvatar");
    const navUsername = document.getElementById("navUsername");

    const avatar = user.avatar || "final_icon-removebg-preview.png";
    const username = user.username || "User";

    // Set all username and avatar areas
    profileIcon.src = avatar;
    if (navUserAvatar) navUserAvatar.src = avatar;
    if (navUsername) navUsername.textContent = username;
    if (navUsernameHeader) navUsernameHeader.textContent = username;

      // Click event — go to profile page
    const navUserProfile = document.getElementById("navUserProfile");
    navUserProfile.addEventListener("click", () => {
      window.location.href = "../Profile/profile.html";
    });

    // Make username clickable → goes to profile
    if (navUsernameHeader) {
      navUsernameHeader.addEventListener("click", () => {
        window.location.href = "../Profile/profile.html";
      });
    }
    profileIcon.addEventListener("click", () => {
      window.location.href = "../Profile/profile.html";
    });
  } catch (err) {
    console.error("⚠️ Failed to load user profile:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadUserProfile);


// Call when page loads
document.addEventListener("DOMContentLoaded", loadUserProfile);


// === DYNAMIC PAGE SWITCHER ===
function changePage(title, content, showPostBox = false) {
  mainCenter.innerHTML = `
    <h2 id="pageTitle">${title}</h2>
    ${showPostBox ? `
      <div class="create-post">
        <div class="ptop">
          <img src="final_icon-removebg-preview.png" alt="">
          <input type="text" placeholder="Write here..." id="openPostModal">
        </div>
      </div>
    ` : ""}
    <div class="page-content">${content}</div>
  `;

  const input = document.getElementById("openPostModal");
  if (input) input.addEventListener("click", openModal);
}

// === LOST & FOUND ===
document.getElementById("lostBtn").addEventListener("click", () => {
  changePage(
    "Lost and Found ⚠️",
    `
      <div id="lostFeed"><p>Loading lost and found posts...</p></div>
      <div class="create-post" style="margin-top:15px;">
        <div class="ptop">
          <img src="final_icon-removebg-preview.png" alt="">
          <input type="text" id="lostTitle" placeholder="Item name or short title...">
        </div>
        <textarea id="lostDescription" placeholder="Describe the lost/found item..." 
          style="width:100%; margin-top:10px; border-radius:10px; border:1px solid #ccc; padding:10px;"></textarea>
        <select id="lostStatus" style="width:100%; margin-top:10px; border-radius:10px; border:1px solid #ccc; padding:10px;">
          <option value="lost">🔎 Lost Item</option>
          <option value="found">📦 Found Item</option>
        </select>
        <input type="file" id="lostImageInput" accept="image/*" style="margin-top:10px;">
        <img id="lostPreviewImage" style="width:100%; margin-top:10px; border-radius:10px; display:none;">
        <button class="post-btn" id="postLostBtn">Post Item</button>
      </div>
    `
  );

  loadLostItems();

  const fileInput = document.getElementById("lostImageInput");
  const preview = document.getElementById("lostPreviewImage");
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("postLostBtn").addEventListener("click", createLostItem);
});

async function loadLostItems() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("lostFeed");
  if (!token) return feed.innerHTML = "<p>Please log in to view lost/found posts.</p>";

  try {
    const res = await fetch("http://localhost:5000/api/lostfound", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.length) return feed.innerHTML = "<p>No items yet. 🕵️</p>";

    feed.innerHTML = data.map(item => `
      <div class="birthday-post">
        <div class="birthday-header">
          <img src="${item.user?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
          <div>
            <h3>${item.user?.username || "Unknown User"}</h3>
            <span>${new Date(item.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div class="birthday-body">
          <h3>${item.title}</h3>
          <p>${item.description}</p>
          ${item.image ? `<img src="${item.image}" class="birthday-image">` : ""}
          <p><b>Status:</b> ${item.status}</p>
        </div>
        <div class="birthday-footer">
          <a href="mailto:${item.user?.email || ''}" class="comment-btn">
            <i class="fa-solid fa-envelope"></i> Contact Poster
          </a>
        </div>
      </div>
    `).join("");
  } catch {
    feed.innerHTML = "<p>Failed to load lost/found items.</p>";
  }
}

async function createLostItem() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("lostTitle").value.trim();
  const description = document.getElementById("lostDescription").value.trim();
  const status = document.getElementById("lostStatus").value;
  const file = document.getElementById("lostImageInput").files[0];

  if (!title || !description) return alert("Please fill all fields.");

  const submit = async (image = "") => {
    try {
      const res = await fetch("http://localhost:5000/api/lostfound", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, status, image }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showNotification("✅ Lost/Found item posted!", "success");
      loadLostItems();
    } catch (err) {
      showNotification("❌ " + err.message, "error");
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => submit(e.target.result);
    reader.readAsDataURL(file);
  } else submit();
}

// === SCHOOL NEWS ===
document.getElementById("newsBtn").addEventListener("click", () => {
  changePage(
    "School News 📰",
    `
      <div id="newsFeed"><p>Loading school news...</p></div>
      <div class="create-post" style="margin-top:15px;">
        <div class="ptop">
          <img src="final_icon-removebg-preview.png" alt="">
          <input type="text" id="newsTitle" placeholder="Enter news title...">
        </div>
        <textarea id="newsContent" placeholder="Write school news here..." 
          style="width:100%; margin-top:10px; border-radius:10px; border:1px solid #ccc; padding:10px;"></textarea>
        <input type="file" id="newsImageInput" accept="image/*" style="margin-top:10px;">
        <img id="newsPreviewImage" style="width:100%; margin-top:10px; border-radius:10px; display:none;">
        <button class="post-btn" id="postNewsBtn">Post News</button>
      </div>
    `
  );
  loadSchoolNews();

  const fileInput = document.getElementById("newsImageInput");
  const preview = document.getElementById("newsPreviewImage");
  fileInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("postNewsBtn").addEventListener("click", createSchoolNews);
});

async function loadSchoolNews() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("newsFeed");
  if (!token) return feed.innerHTML = "<p>Please log in to view news.</p>";

  try {
    const res = await fetch("http://localhost:5000/api/news", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    if (!data.length) return feed.innerHTML = "<p>No news yet. 📰</p>";

    feed.innerHTML = data.map(n => `
      <div class="birthday-post">
        <div class="birthday-header">
          <img src="${n.createdBy?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
          <div><h3>${n.createdBy?.username || "Unknown"}</h3><span>${new Date(n.createdAt).toLocaleString()}</span></div>
        </div>
        <div class="birthday-body">
          <h3>${n.title}</h3><p>${n.content}</p>
          ${n.image ? `<img src="${n.image}" class="birthday-image">` : ""}
        </div>
      </div>
    `).join("");
  } catch {
    feed.innerHTML = "<p>Failed to load school news.</p>";
  }
}

async function createSchoolNews() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("newsTitle").value.trim();
  const content = document.getElementById("newsContent").value.trim();
  const file = document.getElementById("newsImageInput").files[0];
  if (!title || !content) return alert("Please fill in all fields.");

  const submit = async (image = "") => {
    try {
      const res = await fetch("http://localhost:5000/api/news", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content, image }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showNotification("📰 News posted!", "success");
      loadSchoolNews();
    } catch (err) {
      showNotification("❌ " + err.message, "error");
    }
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => submit(e.target.result);
    reader.readAsDataURL(file);
  } else submit();
}

// === ANNOUNCEMENTS ===
document.getElementById("announcementBtn").addEventListener("click", () => {
  changePage(
    "Announcements 📢",
    `
      <div id="announcementFeed"><p>Loading announcements...</p></div>
      <div class="create-post" style="margin-top:15px;">
        <div class="ptop">
          <img src="final_icon-removebg-preview.png" alt="">
          <input type="text" id="announcementTitle" placeholder="Announcement title...">
        </div>
        <textarea id="announcementContent" placeholder="Write your announcement..." style="width:100%; margin-top:10px; border-radius:10px; border:1px solid #ccc; padding:10px;"></textarea>
        <button class="post-btn" id="postAnnouncementBtn">Post Announcement</button>
      </div>
    `
  );
  loadAnnouncements();
  document.getElementById("postAnnouncementBtn").addEventListener("click", createAnnouncement);
});

async function loadAnnouncements() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("announcementFeed");
  if (!token) return feed.innerHTML = "<p>Please log in to view announcements.</p>";

  try {
    const res = await fetch("http://localhost:5000/api/announcements", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    if (!data.length) return feed.innerHTML = "<p>No announcements yet 📢</p>";

    feed.innerHTML = data.map(a => `
      <div class="birthday-post">
        <div class="birthday-header">
          <img src="${a.createdBy?.avatar || 'announce.png'}" class="birthday-avatar">
          <div><h3>${a.createdBy?.username || "Admin"}</h3><span>${new Date(a.createdAt).toLocaleString()}</span></div>
        </div>
        <div class="birthday-body">
          <h3>${a.title}</h3><p>${a.content}</p>
        </div>
      </div>
    `).join("");
  } catch {
    feed.innerHTML = "<p>Failed to load announcements.</p>";
  }
}

async function createAnnouncement() {
  const token = localStorage.getItem("token");
  if (!token) return alert("Please log in first!");

  const title = document.getElementById("announcementTitle").value.trim();
  const content = document.getElementById("announcementContent").value.trim();
  if (!title || !content) return alert("Please fill both fields.");

  try {
    const res = await fetch("http://localhost:5000/api/announcements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, content }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);
    showNotification("📢 Announcement posted!", "success");
    loadAnnouncements();
  } catch (err) {
    showNotification("❌ " + err.message, "error");
  }
}

// === BIRTHDAY GREETINGS ===
document.getElementById("birthdayBtn").addEventListener("click", () => {
  changePage("Birthday Greetings 🎉", `<div id="birthdayFeed"><p>Loading greetings...</p></div>`, true);
  loadBirthdayGreetings();
});

async function loadBirthdayGreetings() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("birthdayFeed");
  if (!token) return feed.innerHTML = "<p>Please log in.</p>";

  try {
    const res = await fetch("http://localhost:5000/api/birthdays", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    if (!data.length) return feed.innerHTML = "<p>No greetings yet 🎂</p>";

    feed.innerHTML = data.map(g => `
      <div class="birthday-post">
        <div class="birthday-header">
          <img src="${g.author?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
          <div><h3>${g.author?.username || "Unknown"}</h3><span>${new Date(g.createdAt).toLocaleString()}</span></div>
        </div>
        <div class="birthday-body">
          <p><b>🎉 @${g.recipient?.username || "Unknown"}</b></p>
          <p>${g.message}</p>
          ${g.image ? `<img src="${g.image}" class="birthday-image">` : ""}
        </div>
      </div>
    `).join("");
  } catch {
    feed.innerHTML = "<p>Failed to load greetings.</p>";
  }
}
// === HANDLE BIRTHDAY GREETING POST ===
document.addEventListener("DOMContentLoaded", () => {

  const imageIcon = document.getElementById("imageIcon");
  const fileInput = document.getElementById("fileInput");
  const previewImage = document.getElementById("previewImage");

  // Open file selection when clicking image icon
  imageIcon.addEventListener("click", () => {
    fileInput.click();
  });

  // Show preview when file is selected
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImage.src = e.target.result;
      previewImage.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

});

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("post-btn")) {
    const token = localStorage.getItem("token");
    if (!token) return alert("Please log in first!");

    const message = document.getElementById("greetMessage").value.trim();
    const file = document.getElementById("fileInput").files[0];
    const recipientUsername = prompt("Enter the recipient's username:");

    if (!recipientUsername || !message) return alert("Please fill all fields.");

    const submit = async (image = "") => {
      try {
        const res = await fetch("http://localhost:5000/api/birthdays", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipientUsername, message, image }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        showNotification("🎉 Birthday greeting posted!", "success");
        closeModal();
        loadBirthdayGreetings();
      } catch (err) {
        showNotification("❌ " + err.message, "error");
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => submit(e.target.result);
      reader.readAsDataURL(file);
    } else submit();
  }
});


// === NOTIFICATION POPUP ===
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

// === DROPDOWN & LOGOUT ===
const profileIcon = document.getElementById("profileIcon");
const profileDropdown = document.getElementById("profileDropdown");
const msgIcon = document.getElementById("msgIcon");
const notifIcon = document.getElementById("notifIcon");
const msgDropdown = document.getElementById("msgDropdown");
const notifDropdown = document.getElementById("notifDropdown");

function closeAll() {
  profileDropdown.classList.remove("active");
  msgDropdown.classList.remove("active");
  notifDropdown.classList.remove("active");
}

[profileIcon, msgIcon, notifIcon].forEach(icon =>
  icon.addEventListener("click", e => {
    e.stopPropagation();
    const dropdown = {
      [profileIcon.id]: profileDropdown,
      [msgIcon.id]: msgDropdown,
      [notifIcon.id]: notifDropdown,
    }[icon.id];
    const isOpen = dropdown.classList.contains("active");
    closeAll();
    if (!isOpen) dropdown.classList.add("active");
  })
);

document.addEventListener("click", e => {
  if (![profileDropdown, msgDropdown, notifDropdown].some(d => d.contains(e.target))) closeAll();
});

// === LOGOUT FEATURE ===
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  const token = localStorage.getItem("token");
  if (!token) return (window.location.href = "../../Login/index.html");

  if (logoutBtn)
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("http://localhost:5000/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });
      } catch {}
      localStorage.clear();
      window.location.href = "../../Login/index.html";
    });
});

// === LOAD HOME FEED ===
async function loadHomeFeed() {
  const token = localStorage.getItem("token");
  const feed = document.getElementById("homeFeed");

  if (!token) {
    feed.innerHTML = "<p>Please log in to view your feed.</p>";
    return;
  }

  try {
    // Fetch all four collections at once
    const [birthdaysRes, announcementsRes, newsRes, lostFoundRes] = await Promise.all([
      fetch("http://localhost:5000/api/birthdays", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/announcements", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/news", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("http://localhost:5000/api/lostfound", { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    const [birthdays, announcements, news, lostfound] = await Promise.all([
      birthdaysRes.json(),
      announcementsRes.json(),
      newsRes.json(),
      lostFoundRes.json(),
    ]);

    // Combine all posts into one array
    const allPosts = [
      ...birthdays.map((p) => ({ type: "birthday", ...p })),
      ...announcements.map((p) => ({ type: "announcement", ...p })),
      ...news.map((p) => ({ type: "news", ...p })),
      ...lostfound.map((p) => ({ type: "lostfound", ...p })),
    ];

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allPosts.length === 0) {
      feed.innerHTML = "<p>No recent activity yet. Be the first to post! 🎉</p>";
      return;
    }

    // Generate HTML for each post type
    feed.innerHTML = allPosts
      .map((post) => renderPostHTML(post))
      .join("");
  } catch (err) {
    console.error("Error loading home feed:", err);
    feed.innerHTML = "<p>Failed to load your feed. Please try again later.</p>";
  }
}
function renderPostHTML(post) {
  const date = new Date(post.createdAt).toLocaleString();

  switch (post.type) {
    case "birthday":
      return `
        <div class="birthday-post">
          <div class="birthday-header">
            <img src="${post.author?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
            <div>
              <h3>${post.author?.username || "Unknown User"}</h3>
              <span>${date}</span>
            </div>
          </div>
          <div class="birthday-body">
            <p><b>🎉 @${post.recipient?.username || "Unknown"}</b></p>
            <p>${post.message}</p>
            ${post.image ? `<img src="${post.image}" class="birthday-image">` : ""}
          </div>
        </div>
      `;

    case "announcement":
      return `
        <div class="birthday-post">
          <div class="birthday-header">
            <img src="${post.createdBy?.avatar || 'announce.png'}" class="birthday-avatar">
            <div>
              <h3>${post.createdBy?.username || "Admin"}</h3>
              <span>${date}</span>
            </div>
          </div>
          <div class="birthday-body">
            <h3>📢 ${post.title}</h3>
            <p>${post.content}</p>
          </div>
        </div>
      `;

    case "news":
      return `
        <div class="birthday-post">
          <div class="birthday-header">
            <img src="${post.createdBy?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
            <div>
              <h3>${post.createdBy?.username || "Unknown User"}</h3>
              <span>${date}</span>
            </div>
          </div>
          <div class="birthday-body">
            <h3>📰 ${post.title}</h3>
            <p>${post.content}</p>
            ${post.image ? `<img src="${post.image}" class="birthday-image">` : ""}
          </div>
        </div>
      `;

    case "lostfound":
      return `
        <div class="birthday-post">
          <div class="birthday-header">
            <img src="${post.user?.avatar || 'final_icon-removebg-preview.png'}" class="birthday-avatar">
            <div>
              <h3>${post.user?.username || "Unknown User"}</h3>
              <span>${date}</span>
            </div>
          </div>
          <div class="birthday-body">
            <h3>${post.title}</h3>
            <p><b>Status:</b> ${post.status === "found" ? "📦 Found" : "🔎 Lost"}</p>
            <p>${post.description}</p>
            ${post.image ? `<img src="${post.image}" class="birthday-image">` : ""}
          </div>
        </div>
      `;

    default:
      return "";
  }
}



// === DEFAULT HOME ===
window.addEventListener("DOMContentLoaded", () => {
  changePage("Home", `<div id="homeFeed"><p>Loading feed...</p></div>`, true);
  loadHomeFeed();
});

document.getElementById("homeBtn").addEventListener("click", () => {
  changePage("Home", `<div id="homeFeed"><p>Loading feed...</p></div>`, true);
  loadHomeFeed();
});


