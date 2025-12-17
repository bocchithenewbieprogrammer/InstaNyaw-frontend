// 🔽 VERY TOP of the file
const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";

// frontend/AdminDashboard/analysis/analysis.js

let postsChart = null;
let deptChart = null;

document.addEventListener("DOMContentLoaded", async () => {
  const admin = await requireAdmin();
  if (!admin) return;

  // Activity log panel from previous steps
  initActivityPanel();
  logActivity("Opened Analytics & Report page.");

  setupFilters();
  setupButtons();
  setupSidebar();

  // Initial load
  loadAnalytics();
});

// ==============================
// LOAD ANALYTICS
// ==============================
async function loadAnalytics() {
  try {
    const range = document.getElementById("timeFilter")?.value || 30;

    const res = await fetch(`${API_BASE}/api/admin/analytics?range=${range}`, {
      headers: authHeaders(),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load analytics");

    console.log("Analytics:", data);

    // ======= CARD 1 — TOTAL USERS =======
    document.getElementById("metric-users").textContent =
      data.totals.users || 0;

    document.getElementById("metric-users-sub").textContent =
      `Active users in the last ${range} days`;

    // ======= CARD 2 — POSTS & INTERACTIONS =======
    const totalPosts = data.totals.posts || 0;
    const interactions =
      (data.totals.likes || 0) + (data.totals.comments || 0);

    document.getElementById("metric-posts").textContent = totalPosts;

    document.getElementById("metric-interactions-sub").textContent =
      `${interactions} total interactions`;

    // ======= CARD 3 — RE REPORTED CONTENT (hidden posts) =======
    const hidden = data.totals.hiddenPosts || 0;

    document.getElementById("metric-reported").textContent = hidden;

    document.getElementById("metric-reported-sub").textContent =
      `${hidden} items hidden`;

    // ======= TOP POST WIDGET =======
    renderTopPost(data.topPost);

    // ======= CHARTS =======
    renderActivityChart(
      data.trends?.postsPerDay || [],
      data.trends?.likesPerDay || [],
      data.trends?.commentsPerDay || []
    );

    renderDeptChart(data.departments || {});

  } catch (err) {
    console.error("Analytics Load Error:", err);
  }
}

// ==============================
// TOP POST WIDGET
// ==============================
function renderTopPost(tp) {
  const topPostBox = document.getElementById("topPostContent");
  if (!topPostBox) return;

  if (!tp) {
    topPostBox.innerHTML = "<p>No engagement data yet.</p>";
    return;
  }

  const authorName = tp.user
    ? `${tp.user.username} (${tp.user.firstName || ""} ${tp.user.lastName || ""})`
    : "Unknown User";

  const date = tp.createdAt
    ? new Date(tp.createdAt).toLocaleString()
    : "Unknown date";

  const body =
    tp.content && tp.content.length > 150
      ? tp.content.substring(0, 150) + "..."
      : tp.content || "(No text)";

  topPostBox.innerHTML = `
    <div class="post-title">Type: <b>${tp.postType.toUpperCase()}</b></div>
    <div class="post-meta">By <b>${authorName}</b> • ${date}</div>
    <div class="post-body">${body}</div>

    <div class="big-numbers" style="color:#000;">
      <span>❤️ Likes: ${tp.likeCount}</span>
      <span>💬 Comments: ${tp.commentCount}</span>
    </div>
  `;
}

/* =====================================================
   CHART: ACTIVITY TREND (Posts / Likes / Comments)
===================================================== */

function renderActivityChart(postsPerDay, likesPerDay, commentsPerDay) {
  const ctx = document.getElementById("postsChart");
  if (!ctx) return;

  // Destroy old chart if exists
  if (postsChart) {
    postsChart.destroy();
  }

  // Collect all unique dates from all arrays
  const dateSet = new Set();

  postsPerDay.forEach((d) => dateSet.add(d.date));
  likesPerDay.forEach((d) => dateSet.add(d.date));
  commentsPerDay.forEach((d) => dateSet.add(d.date));

  const labels = Array.from(dateSet).sort();

  // Helper to map counts by date
  const mapCounts = (arr) => {
    const map = {};
    arr.forEach((d) => {
      map[d.date] = d.count;
    });
    return labels.map((date) => map[date] || 0);
  };

  const postsData = mapCounts(postsPerDay);
  const likesData = mapCounts(likesPerDay);
  const commentsData = mapCounts(commentsPerDay);

  postsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Posts",
          data: postsData,
          borderWidth: 2,
          fill: false,
        },
        {
          label: "Likes",
          data: likesData,
          borderWidth: 2,
          borderDash: [4, 4],
          fill: false,
        },
        {
          label: "Comments",
          data: commentsData,
          borderWidth: 2,
          borderDash: [2, 3],
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      tension: 0.3,
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
    },
  });
}

/* =====================================================
   CHART: DEPARTMENT USERS
===================================================== */

function renderDeptChart(departments) {
  const ctx = document.getElementById("deptChart");
  if (!ctx) return;

  if (deptChart) {
    deptChart.destroy();
  }

  const labels = Object.keys(departments);
  const data = Object.values(departments);

  deptChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Users",
          data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}

/* =====================================================
   FILTERS + BUTTON EVENTS
===================================================== */

function setupFilters() {
  const timeFilter = document.getElementById("timeFilter");
  if (!timeFilter) return;

  timeFilter.addEventListener("change", () => {
    const val = timeFilter.value;
    logActivity(`Changed analytics time filter to last ${val} days.`);
    loadAnalytics();
  });
}

function setupButtons() {
  const btnRefresh = document.getElementById("btnRefresh");
  const btnExport = document.getElementById("btnExport");

  if (btnRefresh) {
    btnRefresh.addEventListener("click", () => {
      logActivity("Refreshed analytics data.");
      loadAnalytics();
    });
  }

  if (btnExport) {
    btnExport.addEventListener("click", () => {
      logActivity("Exported analytics report.");
      alert("Exported as PDF (demo only).");
    });
  }
}

/* =====================================================
   SIDEBAR NAVIGATION
===================================================== */

function setupSidebar() {
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const link = item.getAttribute("data-link");

      if (!link) return;

      logActivity(`Navigated to: ${item.innerText.trim()}`);

      window.location.href = link;
    });
  });
}
// ===== Go to Home Feed =====
document.getElementById("goToHome")?.addEventListener("click", () => {
    window.location.href = "../../Webpage/Homepage/Homepage.html";
});

// ===== Logout =====
document.getElementById("adminLogoutBtn")?.addEventListener("click", async () => {
    await adminLogout();
});
