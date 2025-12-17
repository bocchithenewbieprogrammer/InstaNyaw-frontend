document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  if (!form) {
    console.error("❌ Error: Form with id 'registerForm' not found.");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!firstName || !lastName || !email || !password) {
      alert("⚠️ Please fill in all fields.");
      return;
    }

    // ✅ Combine first + last name to make username unique
const username = `${firstName}_${lastName}`.toLowerCase();

    try {
      const response = await fetch(${API_BASE}
/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          role: "student",
        }),
      });

      const data = await response.json();

      console.log("📩 Server Response:", data);

      if (response.ok) {
        alert(`✅ Registration successful! Welcome, ${username}`);
        form.reset();
      } else {
        alert(`❌ Registration failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("🔥 Error during registration:", error);
      alert("⚠️ Unable to connect to the backend. Is it running?");
    }
  });
});
