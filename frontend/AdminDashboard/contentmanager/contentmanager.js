// 🔽 VERY TOP of the file
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";
 =
  location.hostname === "localhost"
    ? ${API_BASE}
"
    : "https://instanyaw-backend.onrender.com";

// ======================================================
// CONTENT MANAGER — CLEAN + FIXED VERSION
// ======================================================

let allPosts = [];
let reportMap = {};

// ======================================================
// INIT
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  const admin = await requireAdmin();
  if (!admin) return;

  setupMenuLinks();
  setupFilters();
  setupLogoutButton();
  setupGoHomeButton();

  await loadAllPosts();

  if (typeof logActivity === "function") {
    logActivity("Loaded Content Manager posts.");
  }
});

// ======================================================
// SIDEBAR LINKS
// ======================================================
function setupMenuLinks() {
  document.querySelectorAll(".menu-item").forEach(item => {
    item.onclick = () => {
      const link = item.dataset.link;
      if (link) window.location.href = link;
    };
  });
}

// ======================================================
// LOAD POSTS + REPORT SUMMARY
// ======================================================
async function loadAllPosts() {
  const tbody = document.getElementById("postTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Loading posts...</td></tr>`;

  try {
    const postReqs = await Promise.all([
      fetch(`${API_BASE}/api/homeposts`, { headers: adminHeaders() }),
      fetch(`${API_BASE}/api/birthdays`, { headers: adminHeaders() }),
      fetch(`${API_BASE}/api/announcements`, { headers: adminHeaders() }),
      fetch(`${API_BASE}/api/news`, { headers: adminHeaders() }),
      fetch(`${API_BASE}/api/lostfound`, { headers: adminHeaders() }),
    ]);

    const [home, birthdays, announcements, news, lostfound] =
      await Promise.all(postReqs.map(r => r.json()));

    // Load report summary
    const reportRes = await fetch(`${API_BASE}/api/admin/reports/summary`, {
      headers: adminHeaders(),
    });
    const reportData = await reportRes.json();

    reportMap = {};
    reportData.forEach(r => {
      reportMap[`${r.postType}_${r.postId}`] = r;
    });

    allPosts = [
      ...home.map(p => normalizePost(p, "homepost")),
      ...birthdays.map(p => normalizePost(p, "birthday")),
      ...announcements.map(p => normalizePost(p, "announcement")),
      ...news.map(p => normalizePost(p, "news")),
      ...lostfound.map(p => normalizePost(p, "lostfound")),
    ];

    allPosts.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    renderPosts(allPosts);

  } catch (err) {
    console.error("loadAllPosts error:", err);
    tbody.innerHTML = `<tr><td colspan="8">Failed to load posts.</td></tr>`;
  }
}

// ======================================================
// NORMALIZE POST DATA (DATA ONLY)
// ======================================================
function normalizePost(p, type) {
  const user = p.user || p.createdBy || p.recipient || {};
  const reportKey = `${type}_${p._id}`;
  const reportInfo = reportMap[reportKey];

  let contentText = "";
  switch (type) {
    case "homepost": contentText = p.content || ""; break;
    case "birthday": contentText = p.message || ""; break;
    case "announcement":
    case "news":
      contentText = `${p.title || ""} – ${p.content || ""}`;
      break;
    case "lostfound":
      contentText = `${p.title || ""} – ${p.description || ""}`;
      break;
  }

  return {
    _id: p._id,
    postType: type,
    username: user.username || "unknown",
    fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    department: (user.department || "").toUpperCase(),
    contentText,
    hidden: !!p.hidden,
    createdAt: p.createdAt || new Date().toISOString(),
    reportCount: reportInfo ? reportInfo.count : 0,
    reporters: reportInfo ? reportInfo.users : [],
  };
}

// ======================================================
// RENDER TABLE
// ======================================================
function renderPosts(posts) {
  const tbody = document.getElementById("postTableBody");
  if (!tbody) return;

  if (!posts.length) {
    tbody.innerHTML = `<tr><td colspan="9">No posts found.</td></tr>`;
    return;
  }

  tbody.innerHTML = posts.map((p, i) => `
    <tr>
      <td>${i + 1}</td>

      <td>${p.postType.toUpperCase()}</td>

      <td>
        <strong>${p.fullName || "(No name)"}</strong>
        <div class="user-username">@${p.username}</div>
      </td>

      <td>${p.department || "N/A"}</td>

      <td>
        <button class="btn-small btn-view"
                data-id="${p._id}" data-type="${p.postType}">
          View Post
        </button>
      </td>

      <td>${new Date(p.createdAt).toLocaleString()}</td>

      <td>
        <button class="btn-small btn-toggle-hide"
          data-id="${p._id}" data-type="${p.postType}"
          data-hidden="${p.hidden}">
          ${p.hidden ? "Unhide" : "Hide"}
        </button>

        <button class="btn-small btn-delete"
          data-id="${p._id}" data-type="${p.postType}">
          Delete
        </button>
      </td>

      <!-- ✅ REPORTS COLUMN -->
      <td>
        ${
          p.reportCount > 0
            ? `<button class="btn-small btn-report"
                        data-id="${p._id}"
                        data-type="${p.postType}">
                 ${p.reportCount}
               </button>`
            : `<span class="muted">0</span>`
        }
      </td>
    </tr>
  `).join("");

  attachActionHandlers();
  attachReportHandlers();
}
function attachReportHandlers() {
  document.querySelectorAll(".btn-report").forEach(btn => {
    btn.onclick = () => {
      const key = `${btn.dataset.type}_${btn.dataset.id}`;
      const report = reportMap[key];

      if (!report || !report.users?.length) {
        alert("No report details found.");
        return;
      }

      const listHTML = report.users.map(u => `
        <li>
          <strong>${u.firstName} ${u.lastName}</strong><br>
          @${u.username}<br>
          <small>${u.email}</small>
        </li>
      `).join("");

      document.getElementById("reportList").innerHTML = listHTML;
      document.getElementById("reportModal").style.display = "flex";
    };
  });
}


// ======================================================
// ACTION HANDLERS
// ======================================================
function attachActionHandlers() {
  document.querySelectorAll(".btn-view").forEach(btn => {
    btn.onclick = () => openViewPost(btn.dataset.id, btn.dataset.type);
  });

  document.querySelectorAll(".btn-toggle-hide").forEach(btn => {
    btn.onclick = async () => {
      const hidden = btn.dataset.hidden === "true";
      await handleHideToggle(btn.dataset.id, btn.dataset.type, !hidden);
    };
  });

  document.querySelectorAll(".btn-delete").forEach(btn => {
    btn.onclick = () => handleDeletePost(btn.dataset.id, btn.dataset.type);
  });
}

// ======================================================
// HIDE / UNHIDE
// ======================================================
async function handleHideToggle(id, type, hide) {
  const action = hide ? "hide" : "unhide";
  await fetch(`${API_BASE}/api/admin/${action}/${type}/${id}`, {
    method: "PUT",
    headers: adminHeaders(),
  });
  loadAllPosts();
}
function closeViewModal() {
  document.getElementById("viewPostModal").style.display = "none";
}


// ======================================================
// DELETE
// ======================================================
async function handleDeletePost(id, type) {
  if (!confirm("Delete this post permanently?")) return;
  await fetch(`${API_BASE}/api/admin/delete/${type}/${id}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
  loadAllPosts();
}

// ======================================================
// VIEW POST MODAL (UNCHANGED LOGIC)
// ======================================================
// ======================================================
// VIEW POST MODAL — FULL HOMEFEED STYLE (RESTORED)
// ======================================================
// ======================================================
// VIEW POST — USE HOMEPAGE RENDERER (FIXED)
// ======================================================
async function openViewPost(id, type) {
  const endpointMap = {
    homepost: "homeposts",
    birthday: "birthdays",
    announcement: "announcements",
    news: "news",
    lostfound: "lostfound",
  };

  const endpoint = endpointMap[type];
  if (!endpoint) {
    alert("Unsupported post type");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/${endpoint}/${id}`, {
      headers: adminHeaders(),
    });

    const post = await res.json();
    if (!res.ok) throw new Error("Failed to load post");

    // 🔑 CRITICAL FIXES
    post.type = type;      // so renderPostHTML switch works
    post.inModal = true;   // disable homepage click overlays

    // Render EXACT homepage post
    const html = renderPostHTML(post);

    const modal = document.getElementById("viewPostModal");
    const content = document.getElementById("modalContent");

    content.innerHTML = html;
    modal.style.display = "flex";

    // Close modal when clicking outside post
    modal.onclick = (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
        modal.onclick = null;
      }
    };

  } catch (err) {
    console.error("View post error:", err);
    alert("Unable to render post");
  }
}






// ======================================================
// FILTERS
// ======================================================
function setupFilters() {
  ["filterType", "filterDept", "filterSearch"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", applyFilters);
  });
}

function applyFilters() {
  const type = filterType.value;
  const dept = filterDept.value.toLowerCase();
  const search = filterSearch.value.toLowerCase();

  renderPosts(allPosts.filter(p => {
    if (type !== "all" && p.postType !== type) return false;
    if (dept !== "all" && p.department.toLowerCase() !== dept) return false;
    return !search || `${p.username} ${p.fullName} ${p.contentText}`.toLowerCase().includes(search);
  }));
}

// ======================================================
// LOGOUT + HOME
// ======================================================
function setupLogoutButton() {
  document.getElementById("adminLogoutBtn")?.addEventListener("click", adminLogout);
}

function setupGoHomeButton() {
  document.getElementById("goToHome")?.addEventListener("click", () => {
    window.location.href = "../../Webpage/Homepage/Homepage.html";
  });
}
