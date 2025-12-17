const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://instanyaw-backend.onrender.com";

function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requireAdmin() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../../Login/index.html";
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/api/profile/me`, {
      headers: authHeaders(),
    });

    const user = await res.json();
    if (!res.ok) throw new Error("Unauthorized");

    const role = (user.role || "").toLowerCase();
    const isAdmin =
      role === "admin" ||
      role === "headadmin" ||
      role === "subadmin";

    if (!isAdmin) {
      window.location.href = "../../Login/index.html";
      return false;
    }

    return true;
  } catch {
    window.location.href = "../../Login/index.html";
    return false;
  }
}
