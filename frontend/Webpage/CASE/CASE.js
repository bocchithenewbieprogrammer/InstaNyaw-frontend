const msgIcon = document.getElementById("msgIcon");
const notifIcon = document.getElementById("notifIcon");
const profileIcon = document.getElementById("profileIcon");

const msgDropdown = document.getElementById("msgDropdown");
const notifDropdown = document.getElementById("notifDropdown");
const profileDropdown = document.getElementById("profileDropdown");

const seeAllMessagesBtn = document.getElementById("seeAllMessagesBtn");

const chatBox = document.getElementById("chatBox");
const closeChat = document.getElementById("closeChat");
const messageListItems = document.querySelectorAll("#messageList .message-item");
const chatAvatar = chatBox.querySelector(".chatbox-avatar");
const chatHeader = chatBox.querySelector(".chatbox-header h4");
const chatMessages = document.getElementById("chatMessages");
const profileMessageBtn = document.getElementById("profileMessageBtn");

const messageItems = document.querySelectorAll(".message-item");

// ✅ Close all dropdowns
function closeAllDropdowns() {
  msgDropdown.classList.remove("active");
  notifDropdown.classList.remove("active");
  profileDropdown.classList.remove("active");
}


// Toggle dropdown on message icon click
// Toggle message dropdown
msgIcon.addEventListener("click", () => {
    msgDropdown.classList.toggle("active");
});

// Open chatbox when a school is clicked
messageItems.forEach(item => {
    item.addEventListener("click", () => {
        const school = item.dataset.school;
        const avatar = item.dataset.avatar;
        const message = item.dataset.message;

        chatHeader.textContent = school;
        chatAvatar.src = avatar;

        chatMessages.innerHTML = `<div class="message received">${message}</div>`; // initial message

        chatBox.style.display = "flex"; // show chatbox
        msgDropdown.classList.remove("active"); // close dropdown
    });
});

// Close chatbox
closeChat.addEventListener("click", () => {
    chatBox.style.display = "none";
});

// Open chatbox when clicking profile Message button
profileMessageBtn.addEventListener("click", () => {
    const profileLogo = document.querySelector(".profile-logo").src;
    const profileName = document.querySelector(".profile-info h2").textContent;

    chatAvatar.src = profileLogo;
    chatHeader.textContent = profileName;

    // Initial message
    chatMessages.innerHTML = `<div class="message received">Welcome to CASE Department!</div>`;

    chatBox.style.display = "flex"; // show chatbox
});

// Close chatbox
closeChat.addEventListener("click", () => {
    chatBox.style.display = "none";
});

// ✅ Notifications
notifIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = notifDropdown.classList.contains("active");
  closeAllDropdowns();
  if (!isOpen) notifDropdown.classList.add("active");
});

// ✅ Profile
profileIcon.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = profileDropdown.classList.contains("active");
  closeAllDropdowns();
  if (!isOpen) profileDropdown.classList.add("active");
});

// ✅ Close all when clicking outside
document.addEventListener("click", (e) => {
  if (
    !notifIcon.contains(e.target) &&
    !msgIcon.contains(e.target) &&
    !profileIcon.contains(e.target)
  ) {
    closeAllDropdowns();
  }
});



// ✅ Optional: “See all messages” button redirect (if exists)
const seeAllBtn = document.querySelector(".see-all-msg");
if (seeAllBtn) {
  seeAllBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = "/frontend/Webpage/Mess/Message/message.html";
  });
}


// ✅ Tab switching
const postsTab = document.getElementById("posts-tab");
const aboutTab = document.getElementById("about-tab");
const postsSection = document.getElementById("posts-section");
const aboutSection = document.getElementById("about-section");

postsTab.addEventListener("click", (e) => {
  e.preventDefault();
  postsTab.classList.add("active");
  aboutTab.classList.remove("active");
  postsSection.style.display = "flex";
  aboutSection.style.display = "none";
});

aboutTab.addEventListener("click", (e) => {
  e.preventDefault();
  aboutTab.classList.add("active");
  postsTab.classList.remove("active");
  postsSection.style.display = "none";
  aboutSection.style.display = "flex";

  // Add animation
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

// ✅ Smooth scroll when clicking Featured card
const featuredCard = document.getElementById('featuredCard');
const postDL = document.getElementById('postDL');

if (featuredCard && postDL) {
  featuredCard.addEventListener('click', () => {
    postDL.scrollIntoView({ behavior: 'smooth' });
  });
}

const viewer = document.getElementById("imageViewer");
const viewerImg = document.getElementById("viewerImg");
const viewerTitle = document.getElementById("viewerTitle");
const viewerCaption = document.getElementById("viewerCaption");
const closeBtn = document.querySelector(".viewer .close");
const nextBtn = document.querySelector(".next");
const prevBtn = document.querySelector(".prev");

let currentImages = [];
let currentIndex = 0;

// Attach click listener per post
document.querySelectorAll(".box").forEach(post => {
  const imgs = Array.from(post.querySelectorAll(".dl-album img,img.viewable"));
  
  imgs.forEach((img, index) => {
    img.addEventListener("click", () => {
      currentImages = imgs; // images lang ng current post
      currentIndex = index;
      openViewer(currentImages[currentIndex], post);
    });
  });
});

// Open viewer
function openViewer(img, post) {
  viewerImg.src = img.src;
  viewerTitle.textContent = img.dataset.title || "CASE LCUP";
  viewerCaption.textContent = img.dataset.caption || img.alt || "";
  viewer.style.display = "flex";
}

// Buttons
closeBtn.addEventListener("click", () => {
  viewer.style.display = "none";
});

nextBtn.addEventListener("click", () => {
  currentIndex = (currentIndex + 1) % currentImages.length;
  openViewer(currentImages[currentIndex]);
});

prevBtn.addEventListener("click", () => {
  currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
  openViewer(currentImages[currentIndex]);
});
