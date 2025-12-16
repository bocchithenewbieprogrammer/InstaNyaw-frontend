const notifIcon = document.querySelector('.notification');
const msgIcon = document.querySelector('.message');
const notifBox = document.getElementById('notifBox');
const msgBox = document.getElementById('msgBox');
const profileIcon = document.getElementById('profileIcon');
const profileDropdown = document.getElementById('profileDropdown');

// Toggle Notifications
notifIcon.addEventListener('click', () => {
  notifBox.classList.toggle('active');
  msgBox.classList.remove('active');
  profileDropdown.classList.remove('active'); // close dropdown
});

// Toggle Messages
msgIcon.addEventListener('click', () => {
  msgBox.classList.toggle('active');
  notifBox.classList.remove('active');
  profileDropdown.classList.remove('active'); // close dropdown
});

// ✅ Toggle Profile Dropdown
profileIcon.addEventListener('click', (e) => {
  e.stopPropagation(); // para hindi magsara agad
  profileDropdown.classList.toggle('active');
  notifBox.classList.remove('active');
  msgBox.classList.remove('active');
});

// ✅ Close all when clicking outside
document.addEventListener('click', (e) => {
  if (
    !notifIcon.contains(e.target) &&
    !msgIcon.contains(e.target) &&
    !profileIcon.contains(e.target)
  ) {
    notifBox.classList.remove('active');
    msgBox.classList.remove('active');
    profileDropdown.classList.remove('active');
  }
});

// ✅ Tab switching
const postsTab = document.getElementById("posts-tab");
const aboutTab = document.getElementById("about-tab");
const postsSection = document.getElementById("posts-section");
const aboutSection = document.getElementById("about-section");

postsTab.addEventListener("click", (e) => {
  e.preventDefault();
  postsTab.classList.add("active");
  aboutTab.classList.remove("active");
  postsSection.style.display = "block";
  aboutSection.style.display = "none";
});

aboutTab.addEventListener("click", (e) => {
  e.preventDefault();
  aboutTab.classList.add("active");
  postsTab.classList.remove("active");
  postsSection.style.display = "none";

  // 🔥 Add animation
  aboutSection.style.display = "flex";
  aboutSection.classList.remove("slide-in"); // reset animation if needed
  void aboutSection.offsetWidth; // force reflow to restart animation
  aboutSection.classList.add("slide-in");


  // 🔥 Optional: slide effect pag balik sa posts
  postsSection.classList.remove("slide-in-left");
  void postsSection.offsetWidth;
  postsSection.classList.add("slide-in-left");
});

// ✅ About subsection switching
function showSection(section) {
  document.getElementById("contact").style.display = "none";
  document.getElementById("transparency").style.display = "none";

  const items = document.querySelectorAll(".about-sidebar li");
  items.forEach(item => item.classList.remove("active"));

  document.getElementById(section).style.display = "block";
  event.target.classList.add("active");
}

