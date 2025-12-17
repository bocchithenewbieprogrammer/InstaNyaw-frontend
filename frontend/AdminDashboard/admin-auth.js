// ========== ADMIN AUTH GUARD ==========

// Change this if your backend uses a different URL
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";
 = "https://instanyaw-backend.onrender.com";


// Runs on every admin page
async function requireAdmin() {
  const token = localStorage.getItem("token");

  if (!token) {
    alert("Access denied. Please log in first.");
    window.location.href = "../../Login/index.html"; 
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to load user");

    const user = await res.json();

    // Only admins and headadmins allowed
    if (user.role !== "admin" && user.role !== "headadmin") {
      alert("You are not authorized to access the Admin Dashboard.");
      window.location.href = "../../Homepage/Homepage.html";
      return null;
    }

    // Make admin user global
    window.adminUser = user;
    window.adminToken = token;

    return user;

  } catch (err) {
    console.error("Admin Auth Error:", err);
    alert("Session expired. Please log in again.");
    localStorage.clear();
    window.location.href = "../../Login/index.html";
    return null;
  }
}
// Highlight active page in sidebar
function highlightActiveMenu() {
    const currentPath = window.location.pathname;

    document.querySelectorAll(".menu-item").forEach(item => {
        const target = item.getAttribute("data-link");
        if (!target) return;

        // Convert relative path to normalized compare string
        const normalizedTarget = target.replace("..", "").replace(/\/\//g, "/");
        const normalizedPath = currentPath.replace(/\/\//g, "/");

        // Check if this menu-item matches the current page
        if (normalizedPath.endsWith(normalizedTarget.replace("../", ""))) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    highlightActiveMenu();
});

// helper for authenticated fetch
function adminHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${window.adminToken || localStorage.getItem("token")}`,
    ...extra
  };
}
// ========== ADMIN LOGOUT ==========
async function adminLogout() {
  const token = localStorage.getItem("token");
  try {
    if (token) {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (err) {
    console.error("Logout error:", err);
  }
  localStorage.clear();
  window.location.href = "../../Login/index.html";
}

// ========== GLOBAL ACTIVITY LOG HELPERS ==========
let activityPollingStarted = false;

// Call this from ANY admin page to record an action
async function logActivity(message, meta = {}) {
  // 1) Show immediately in UI (if panel exists)
  appendActivityItem({
    action: message,
    createdAt: new Date().toISOString(),
  });

  // 2) Send to backend (best-effort)
  try {
    await fetch(`${API_BASE}/api/activity`, {
      method: "POST",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ action: message, meta }),
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}

// Render a single entry into the right-side panel
function appendActivityItem(entry, prepend = true) {
  const list = document.getElementById("activityList");
  if (!list) return;

  const time = new Date(entry.createdAt).toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "activity-item";
  div.innerHTML = `
    <div>${entry.action}</div>
    <span class="activity-time">${time}</span>
  `;

  if (prepend) list.prepend(div);
  else list.appendChild(div);
}

// Load recent history from backend
async function loadActivityHistory(range = "recent") {
  const list = document.getElementById("activityList");
  if (!list) return;

  try {
    const res = await fetch(`${API_BASE}/api/activity?range=${range}`, {
      headers: adminHeaders(),
    });
    const logs = await res.json();
    if (!Array.isArray(logs)) return;

    list.innerHTML = "";
    logs.forEach((log) => appendActivityItem(log, false));
  } catch (err) {
    console.error("Failed to load activity history:", err);
  }
}

// Call this once per page to bind the panel
function initActivityPanel() {
  const list = document.getElementById("activityList");
  if (!list) return;

  loadActivityHistory("recent");

  if (!activityPollingStarted) {
    activityPollingStarted = true;
    setInterval(() => loadActivityHistory("recent"), 10000);
  }
}
// ========== SIDEBAR NAVIGATION (GLOBAL) ==========
function setupAdminSidebar() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.getAttribute("data-link");
      if (!link) return;

      // Optional: log activity
      if (typeof logActivity === "function") {
        logActivity(`Navigated to: ${item.innerText.trim()}`);
      }

      window.location.href = link;
    });
  });

  highlightActiveMenu();
}

// Highlight active page in sidebar
function highlightActiveMenu() {
  const currentPath = window.location.pathname.replace(/\\/g, "/");

  document.querySelectorAll(".menu-item").forEach((item) => {
    const target = item.getAttribute("data-link");
    if (!target) return;

    const normalizedTarget = target
      .replace("..", "")
      .replace(/\/\//g, "/")
      .replace("../", "/frontend/AdminDashboard/");

    if (currentPath.endsWith(normalizedTarget.replace("../", ""))) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// Call this on every admin page after requireAdmin()
document.addEventListener("DOMContentLoaded", () => {
  // we only run if there is a sidebar on the page
  if (document.querySelector(".menu-item")) {
    setupAdminSidebar();
  }
});

