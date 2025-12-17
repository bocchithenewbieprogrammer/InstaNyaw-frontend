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

// frontend/AdminDashboard/user/adminuser.js

// Assumes ../admin-auth.js defines: API_BASE, adminHeaders(), requireAdmin(), adminLogout(), logActivity()

let allUsers = [];

// ========== MAIN INIT ==========
document.addEventListener("DOMContentLoaded", async () => {
  const admin = await requireAdmin();   // from admin-auth.js
  if (!admin) return;                  // non-admins are redirected

  await loadUsers();
  setupFilterHandlers();
  setupLogoutButton();
  setupSidebarBottomButtons();
});

// ========== LOAD USERS FROM BACKEND ==========
async function loadUsers() {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) {
    console.warn("⚠️ No #userTableBody element found in adminuser.html");
    return;
  }

  tbody.innerHTML = `<tr><td colspan="6">Loading users...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: adminHeaders(), // from admin-auth.js
    });

    if (!res.ok) throw new Error("Failed to load users");

    const users = await res.json();
    allUsers = users;
    renderUsers(users);

    if (typeof logActivity === "function") {
      logActivity("Loaded user list from server");
    }
  } catch (err) {
    console.error("loadUsers error:", err);
    tbody.innerHTML = `<tr><td colspan="6">Failed to load users.</td></tr>`;
  }
}

// ========== RENDER USERS IN TABLE ==========
function renderUsers(users) {
  const tbody = document.getElementById("userTableBody");
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6">No users found.</td></tr>`;
    return;
  }

  tbody.innerHTML = users
    .map((u, index) => {
      const isBanned = !!u.isBanned;
      const statusText = isBanned ? "BANNED" : "ACTIVE";
      const statusClass = isBanned ? "banned" : "active";

      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "(No name)";
      const username = u.username ? `@${u.username}` : "";
      const email = u.email || "";

      const createdAt = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString()
        : "-";

      return `
        <tr data-id="${u._id}">
          <td>${index + 1}</td>

          <!-- Full Name -->
          <td>
            <div class="user-main">
              <div class="user-name">
                <strong>${fullName}</strong>
                ${username ? `<span class="user-username">${username}</span>` : ""}
              </div>
            </div>
          </td>

          <!-- Email -->
          <td>
            <div class="user-email">${email}</div>
          </td>

          <!-- Status -->
          <td>
            <span class="badge badge-status ${statusClass}">
              ${statusText}
            </span>
          </td>

          <!-- Joined Date -->
          <td>${createdAt}</td>

          <!-- Actions -->
          <td class="user-actions">
            ${renderUserActionButtons(u, isBanned)}
          </td>
        </tr>
      `;
    })
    .join("");

  attachActionHandlers();
}

// Helper: action buttons depending on state
function renderUserActionButtons(user, isBanned) {
  const isAdmin = user.role === "admin" || user.role === "headadmin";
  const isHead = user.role === "headadmin";

  const canModifyRole = !isHead;
  const canBan = !isHead;

  return `
    <div class="action-buttons">
      ${
        canBan
          ? `
        <button class="btn-small ${
          isBanned ? "btn-unban" : "btn-ban"
        }" data-id="${user._id}" data-action="${
              isBanned ? "unban" : "ban"
            }">
          ${isBanned ? "Unban" : "Ban"}
        </button>
      `
          : ""
      }

      ${
        canModifyRole
          ? `
        <button class="btn-small btn-role" data-id="${user._id}" data-action="${
              isAdmin ? "demote" : "promote"
            }">
          ${isAdmin ? "Demote to User" : "Promote to Admin"}
        </button>
      `
          : ""
      }

      ${
        !isHead
          ? `
        <button class="btn-small btn-delete" data-id="${user._id}" data-action="delete">
          Delete
        </button>
      `
          : ""
      }
    </div>
  `;
}

// ========== ATTACH BUTTON HANDLERS ==========
function attachActionHandlers() {
  document.querySelectorAll(".btn-ban, .btn-unban").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      handleBanToggle(id, action === "ban");
    };
  });

  document.querySelectorAll(".btn-role").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      handleRoleChange(id, action === "promote");
    };
  });

  document.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      handleDeleteUser(id);
    };
  });
}

// ========== BAN / UNBAN ==========
async function handleBanToggle(userId, shouldBan) {
  const confirmMsg = shouldBan
    ? "Ban this user? All their posts will be hidden."
    : "Unban this user and unhide all their posts?";
  if (!confirm(confirmMsg)) return;

  try {
    const url = shouldBan
      ? `${API_BASE}/api/admin/ban/${userId}`
      : `${API_BASE}/api/admin/unban/${userId}`;

    const res = await fetch(url, {
      method: "PUT",
      headers: adminHeaders({ "Content-Type": "application/json" }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to update ban status");

    if (typeof logActivity === "function") {
      logActivity(
        shouldBan
          ? `Banned user ${userId} and auto-hid their posts`
          : `Unbanned user ${userId} and auto-unhid their posts`
      );
    }

    await loadUsers();
  } catch (err) {
    console.error("handleBanToggle error:", err);
    alert(err.message || "Error updating user ban status");
  }
}

// ========== PROMOTE / DEMOTE ==========
async function handleRoleChange(userId, promoteToAdmin) {
  // Your role enum is: "student" | "admin" | "headadmin"
  const role = promoteToAdmin ? "admin" : "student";
  const confirmMsg = promoteToAdmin
    ? "Promote this user to ADMIN?"
    : "Demote this admin back to USER?";
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/role/${userId}`, {
      method: "PUT",
      headers: adminHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to change role");

    if (typeof logActivity === "function") {
      logActivity(
        promoteToAdmin
          ? `Promoted user ${userId} to admin`
          : `Demoted admin ${userId} to user`
      );
    }

    await loadUsers();
  } catch (err) {
    console.error("handleRoleChange error:", err);
    alert(err.message || "Error changing user role");
  }
}

// ========== DELETE USER ==========
async function handleDeleteUser(userId) {
  if (
    !confirm(
      "Are you sure you want to DELETE this user? This cannot be undone."
    )
  )
    return;

  try {
    const res = await fetch(`${API_BASE}/api/admin/delete/${userId}`, {
      method: "DELETE",
      headers: adminHeaders(),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || "Failed to delete user");

    if (typeof logActivity === "function") {
      logActivity(`Deleted user ${userId}`);
    }

    await loadUsers();
  } catch (err) {
    console.error("handleDeleteUser error:", err);
    alert(err.message || "Error deleting user");
  }
}

// ========== FILTERS (optional) ==========
function setupFilterHandlers() {
  const roleSelect = document.getElementById("filterRole");
  const deptSelect = document.getElementById("filterDept");
  const statusSelect = document.getElementById("filterStatus");

  if (roleSelect) {
    roleSelect.addEventListener("change", applyFilters);
  }
  if (deptSelect) {
    deptSelect.addEventListener("change", applyFilters);
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", applyFilters);
  }
}

function applyFilters() {
  const roleSelect = document.getElementById("filterRole");
  const deptSelect = document.getElementById("filterDept");
  const statusSelect = document.getElementById("filterStatus");

  let roleFilter = roleSelect ? roleSelect.value : "all";
  let deptFilter = deptSelect ? deptSelect.value : "all";
  let statusFilter = statusSelect ? statusSelect.value : "all";

  const filtered = allUsers.filter((u) => {
    const isBanned = !!u.isBanned;
    const dept = (u.department || "").toLowerCase();

    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (deptFilter !== "all" && dept !== deptFilter.toLowerCase()) return false;
    if (statusFilter === "banned" && !isBanned) return false;
    if (statusFilter === "active" && isBanned) return false;

    return true;
  });

  renderUsers(filtered);
}

// ========== LOGOUT + GO HOME ==========
function setupLogoutButton() {
  const btn = document.getElementById("adminLogoutBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    await adminLogout(); // from admin-auth.js
  });
}

function setupSidebarBottomButtons() {
  const homeBtn = document.getElementById("goToHome");
  if (homeBtn) {
    homeBtn.addEventListener("click", () => {
      window.location.href = "../../Webpage/Homepage/Homepage.html";
    });
  }
}
