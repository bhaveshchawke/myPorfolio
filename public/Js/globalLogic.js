// ==========================================
// 0. Toast Notification Logic
// ==========================================
const hideToastMessage = (element) => {
  if (!element) return;
  element.classList.remove("is-success", "is-error");
  element.innerHTML = "";
};

const showToastMessage = (element, type, text) => {
  if (!element) return;
  element.classList.remove("is-success", "is-error");
  element.classList.add(type === "success" ? "is-success" : "is-error");
  element.innerHTML = `
    <div class="skill-message-body">
      <p class="skill-message-text">${text}</p>
      <button type="button" class="skill-message-close" aria-label="Close message">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
  const closeBtn = element.querySelector(".skill-message-close");
  closeBtn?.addEventListener("click", () => hideToastMessage(element));
};

// ==========================================
// 0.5 Navbar Hamburger Menu Logic
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const hamburgerMenu = document.getElementById("hamburgerMenu");
  const navRight = document.getElementById("navRight");

  if (hamburgerMenu && navRight) {
    // Toggle menu
    hamburgerMenu.addEventListener("click", (e) => {
      e.stopPropagation();
      hamburgerMenu.classList.toggle("active");
      navRight.classList.toggle("active");
    });

    // Close menu when any nav link is clicked
    navRight.querySelectorAll(".nav-links a").forEach(link => {
      link.addEventListener("click", () => {
        hamburgerMenu.classList.remove("active");
        navRight.classList.remove("active");
      });
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!navRight.contains(e.target) && !hamburgerMenu.contains(e.target)) {
        hamburgerMenu.classList.remove("active");
        navRight.classList.remove("active");
      }
    });
  }
});

// ==========================================
// 1. DevDoor Trigger Logic
// ==========================================
let clickCount = 0;
let lastClickTime = 0;
let clickTimer;
const devDoorTrigger = document.getElementById("devDoorTrigger");
const devDoorSection = document.getElementById("devDoorSection");

if (devDoorTrigger) {
  devDoorTrigger.addEventListener("click", (e) => {
    e.preventDefault();
    const now = Date.now();
    
    // If more than 600ms since last click, reset sequence
    if (now - lastClickTime > 600) {
        clickCount = 0; 
    }
    
    clickCount++;
    lastClickTime = now;
    
    if (clickCount >= 5) {
      if (devDoorSection) {
        devDoorSection.style.display = (devDoorSection.style.display === "none" || devDoorSection.style.display === "") ? "block" : "none";
      }
      clickCount = 0; 
      clearTimeout(clickTimer); 
    } else {
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount === 1) {
          window.location.href = "/"; 
        }
        clickCount = 0;
      }, 600); 
    }
  });
}

// ==========================================
// 1.5 Contact Form Logic
// ==========================================
const contactForm = document.getElementById("contactForm");
const contactMessage = document.getElementById("contactMessage");

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById("contactSubmitBtn");
    submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;

    const formData = new FormData(contactForm);
    const dataObject = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataObject),
      });

      const result = await response.json();

      if (response.ok) {
        showToastMessage(contactMessage, "success", result.message);
        contactForm.reset();
      } else {
        showToastMessage(contactMessage, "error", result.message || "Kuch galat ho gaya!");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToastMessage(contactMessage, "error", "Network Error! Server se connect nahi ho paya.");
    } finally {
      submitBtn.innerHTML = 'Send Message <i class="fa-solid fa-paper-plane"></i>';
      submitBtn.disabled = false;
    }
  });
}

// ==========================================
// 2. AdminForm / DevDoor Form Logic
// ==========================================
const devDoorForm = document.getElementById("adminFormId");
const message = document.getElementById("message");

// ---- File Preview Logic ----
const profilePicInput = document.getElementById("profilePic");
const profilePicPreview = document.getElementById("profilePicPreview");
const profilePicPreviewImg = document.getElementById("profilePicPreviewImg");
const removeProfilePicPreview = document.getElementById("removeProfilePicPreview");

const resumeInput = document.getElementById("resume");
const resumePreview = document.getElementById("resumePreview");
const resumeFileName = document.getElementById("resumeFileName");
const removeResumePreview = document.getElementById("removeResumePreview");

// Profile Pic — preview on select
if (profilePicInput) {
  profilePicInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = function (e) {
        if (profilePicPreviewImg) profilePicPreviewImg.src = e.target.result;
        if (profilePicPreview) profilePicPreview.style.display = "flex";
      };
      reader.readAsDataURL(file);
    }
  });
}

// Profile Pic — remove preview
if (removeProfilePicPreview) {
  removeProfilePicPreview.addEventListener("click", function () {
    if (profilePicInput) profilePicInput.value = "";
    if (profilePicPreview) profilePicPreview.style.display = "none";
    if (profilePicPreviewImg) profilePicPreviewImg.src = "";
  });
}

// Resume — preview filename on select
if (resumeInput) {
  resumeInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      if (resumeFileName) resumeFileName.textContent = file.name;
      if (resumePreview) resumePreview.style.display = "flex";
    }
  });
}

// Resume — remove preview
if (removeResumePreview) {
  removeResumePreview.addEventListener("click", function () {
    if (resumeInput) resumeInput.value = "";
    if (resumePreview) resumePreview.style.display = "none";
    if (resumeFileName) resumeFileName.textContent = "";
  });
}

// ---- Delete Existing Files from Cloudinary ----
const deleteProfilePicBtn = document.getElementById("deleteProfilePicBtn");
const deleteResumeBtn = document.getElementById("deleteResumeBtn");

if (deleteProfilePicBtn) {
  deleteProfilePicBtn.addEventListener("click", async function () {
    if (!confirm("Kya aap sure hain? Profile picture permanently delete ho jaayegi!")) return;
    try {
      const response = await fetch("/admin/deleteProfilePic", { method: "DELETE" });
      const result = await response.json();
      if (response.ok) {
        const existingEl = document.getElementById("existingProfilePic");
        if (existingEl) existingEl.remove();
        if (message) showToastMessage(message, "success", result.message);
      } else {
        if (message) showToastMessage(message, "error", result.message);
      }
    } catch (error) {
      if (message) showToastMessage(message, "error", "Network Error!");
    }
  });
}

if (deleteResumeBtn) {
  deleteResumeBtn.addEventListener("click", async function () {
    if (!confirm("Kya aap sure hain? Resume permanently delete ho jaayega!")) return;
    try {
      const response = await fetch("/admin/deleteResume", { method: "DELETE" });
      const result = await response.json();
      if (response.ok) {
        const existingEl = document.getElementById("existingResume");
        if (existingEl) existingEl.remove();
        if (message) showToastMessage(message, "success", result.message);
      } else {
        if (message) showToastMessage(message, "error", result.message);
      }
    } catch (error) {
      if (message) showToastMessage(message, "error", "Network Error!");
    }
  });
}

// ---- Form Submit — FormData (multipart, no JSON) ----
if (devDoorForm) {
  devDoorForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(devDoorForm);

    try {
      const response = await fetch("/admin/devDoor", {
        method: "POST",
        // NO Content-Type header — browser auto-sets multipart/form-data with boundary
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToastMessage(message, "success", result.message);
        setTimeout(() => {
          window.location.href = "/admin/login";
        }, 2000);
      } else {
        showToastMessage(message, "error", result.message || "Kuch galat ho gaya!");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showToastMessage(message, "error", "Network Error! Server se connect nahi ho paya.");
    }
  });
}

// ==========================================
// 3. Quick Actions for Admin (Homepage)
// ==========================================
window.deleteQuickFile = async function(type) {
  const isProfile = type === 'profilePic';
  if (!confirm(`Kya aap sure hain? ${isProfile ? 'Profile picture' : 'Resume'} permanently delete ho jayega!`)) return;
  
  try {
    const endpoint = isProfile ? '/admin/deleteProfilePic' : '/admin/deleteResume';
    const res = await fetch(endpoint, { method: 'DELETE' });
    const result = await res.json();
    
    const globalMsg = document.getElementById('projectActionMessage') || document.getElementById('serviceActionMessage') || document.getElementById('contactMessage');
    if (res.ok) {
      showToastMessage(globalMsg, "success", result.message);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToastMessage(globalMsg, "error", result.message || "Delete fail ho gaya.");
    }
  } catch(e) {
    const globalMsg = document.getElementById('projectActionMessage') || document.getElementById('serviceActionMessage') || document.getElementById('contactMessage');
    showToastMessage(globalMsg, "error", "Network error.");
  }
}

// ==========================================
// 2. Add Project Form Logic
// ==========================================
const addProjectForm = document.getElementById("addProject");
const mssge = document.getElementById("message");

if (addProjectForm) {
  addProjectForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = 'Saving... <i class="fa-solid fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;

    const formaData = new FormData(addProjectForm);
    const data = Object.fromEntries(formaData.entries());

    try {
      const response = await fetch("/admin/addProjects/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showToastMessage(mssge, "success", result.message || "Project saved successfully");
        // Optional: form clear karne ke liye if not editing
        if (!data.id) addProjectForm.reset(); 
      } else {
        showToastMessage(mssge, "error", result.message);
      }
    } catch (error) {
      console.error(error);
      showToastMessage(mssge, "error", ` ${error}`);
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}
// delete Logic

const deleteBtn = document.querySelectorAll(".delete-icon");
const actionMessage = document.getElementById("projectActionMessage");
const skillDeleteBtns = document.querySelectorAll(".skill-delete-btn");
const skillActionMessage = document.getElementById("skillActionMessage");



deleteBtn.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const isConfirmed = confirm("are you sure want to delete");
      if (isConfirmed) {
        const formId =
          btn.getAttribute("data-id") ||
          btn.getAttribute("href")?.split("/").pop();
        try {
          const responce = await fetch(`/admin/deleteProject/${formId}`, {
            method: "DELETE",
          });
          const result = await responce.json();
          if (responce.ok) {
            showToastMessage(actionMessage, "success", result.message);
            btn.closest(".project-card")?.remove(); // Added DOM removal
          } else {
            showToastMessage(actionMessage, "error", result.message);
          }
        } catch (error) {
          showToastMessage(
            actionMessage,
            "error",
            "Network Error! Server se connect nahi ho paya.",
          );
        }
      }
    });
  }
});

skillDeleteBtns.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const isConfirmed = confirm("are you sure want to delete");

      if (isConfirmed) {
        const skillId =
          btn.getAttribute("data-id") ||
          btn.getAttribute("href")?.split("/").pop();

        try {
          const response = await fetch(`/admin/deleteSkill/${skillId}`, {
            method: "DELETE",
          });
          const result = await response.json();

          if (response.ok) {
            showToastMessage(skillActionMessage, "success", result.message);
            btn.closest(".skill-item")?.remove();
          } else {
            showToastMessage(skillActionMessage, "error", result.message);
          }
        } catch (error) {
          showToastMessage(
            skillActionMessage,
            "error",
            "Network Error! Server se connect nahi ho paya.",
          );
        }
      }
    });
  }
});
//addSkills Logic
const addSkillForm = document.getElementById("addSkillForm");
const skillsContainer = document.getElementById("skillsContainer");
const addMoreSkillBtn = document.getElementById("addMoreSkillBtn");
const skillRow = document.querySelector(".skill-row");
const skillMessage = document.getElementById("skillMessage");

const setSkillMessage = (type, text) => {
  showToastMessage(skillMessage, type, text);
};

const resetSkillFormRows = () => {
  if (!addSkillForm || !skillsContainer) return;

  addSkillForm.reset();

  const allRows = skillsContainer.querySelectorAll(".skill-row");
  allRows.forEach((row, index) => {
    if (index !== 0) {
      row.remove();
    }
  });

  const firstRowInputs = skillsContainer
    .querySelector(".skill-row")
    ?.querySelectorAll("input");
  firstRowInputs?.forEach((input) => (input.value = ""));
};

if (addSkillForm) {
  addMoreSkillBtn.addEventListener("click", () => {
    const newRow = skillRow.cloneNode(true);
    skillsContainer.appendChild(newRow);
    const removeBtn = newRow.querySelector(".btn-remove-row");
    removeBtn.classList.remove("hidden-btn");
    removeBtn.addEventListener("click", function () {
      this.parentElement.remove();
    });
    const inputs = newRow.querySelectorAll("input");
    inputs.forEach((input) => (input.value = ""));
  });
}

//get form data
if (addSkillForm) {
  addSkillForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = addSkillForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = 'Saving... <i class="fa-solid fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;

    const titleData = document.querySelectorAll('input[name="titles[]"]');
    const iconsData = document.querySelectorAll('input[name="icons[]"]');
    let skillsData = [];
    for (let i = 0; i < titleData.length; i++) {
      if (
        titleData[i].value.trim() !== "" &&
        iconsData[i].value.trim() !== ""
      ) {
        skillsData.push({
          skillTitle: titleData[i].value,
          skillIcon: iconsData[i].value,
        });
      }
    }
    try {
      const responce = await fetch("/admin/addSkill", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skillsData }),
      });
      const result = await responce.json();
      if (responce.ok) {
        setSkillMessage("success", result.message);
        resetSkillFormRows();
      } else {
        setSkillMessage("error", result.message);
      }
    } catch (error) {
      setSkillMessage(
        "error",
        "Network Error! Server se connect nahi ho paya.",
      );
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}
// ==========================================
// Services Logic
// ==========================================
const addServiceForm = document.getElementById("addServiceForm");
const servicesContainer = document.getElementById("servicesContainer");
const addMoreServiceBtn = document.getElementById("addMoreServiceBtn");
const serviceRow = document.querySelector(".service-row");
const serviceMessage = document.getElementById("serviceMessage");
const serviceDeleteBtns = document.querySelectorAll(".service-delete-btn");
const serviceActionMessage = document.getElementById("serviceActionMessage");

const setServiceMessage = (type, text) => {
  showToastMessage(serviceMessage, type, text);
};

const resetServiceFormRows = () => {
  if (!addServiceForm || !servicesContainer) return;

  addServiceForm.reset();

  const allRows = servicesContainer.querySelectorAll(".service-row");
  allRows.forEach((row, index) => {
    if (index !== 0) {
      row.remove();
    }
  });

  const firstRowInputs = servicesContainer
    .querySelector(".service-row")
    ?.querySelectorAll("input, textarea");
  firstRowInputs?.forEach((input) => (input.value = ""));
};

if (addServiceForm) {
  addMoreServiceBtn.addEventListener("click", () => {
    const newRow = serviceRow.cloneNode(true);
    servicesContainer.appendChild(newRow);
    const removeBtn = newRow.querySelector(".btn-remove-row");
    removeBtn.classList.remove("hidden-btn");
    removeBtn.addEventListener("click", function () {
      this.parentElement.remove();
    });
    const inputs = newRow.querySelectorAll("input, textarea");
    inputs.forEach((input) => (input.value = ""));
  });
}

// get form data for services
if (addServiceForm) {
  addServiceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = addServiceForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    submitBtn.innerHTML = 'Saving... <i class="fa-solid fa-spinner fa-spin"></i>';
    submitBtn.disabled = true;

    const titleData = document.querySelectorAll('input[name="serviceTitles[]"]');
    const iconsData = document.querySelectorAll('input[name="serviceIcons[]"]');
    const descData = document.querySelectorAll('textarea[name="serviceDescs[]"]');
    let servicesData = [];
    
    for (let i = 0; i < titleData.length; i++) {
      if (
        titleData[i].value.trim() !== "" &&
        iconsData[i].value.trim() !== "" &&
        descData[i].value.trim() !== ""
      ) {
        servicesData.push({
          serviceTitle: titleData[i].value,
          serviceIcon: iconsData[i].value,
          serviceDesc: descData[i].value,
        });
      }
    }
    
    try {
      const responce = await fetch("/admin/addService", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ servicesData }),
      });
      const result = await responce.json();
      if (responce.ok) {
        setServiceMessage("success", result.message);
        resetServiceFormRows();
      } else {
        setServiceMessage("error", result.message);
      }
    } catch (error) {
      setServiceMessage(
        "error",
        "Network Error! Server se connect nahi ho paya.",
      );
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Delete Service Logic
serviceDeleteBtns.forEach((btn) => {
  if (btn) {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const isConfirmed = confirm("Are you sure you want to delete this service?");

      if (isConfirmed) {
        const serviceId =
          btn.getAttribute("data-id") ||
          btn.getAttribute("href")?.split("/").pop();

        try {
          const response = await fetch(`/admin/deleteService/${serviceId}`, {
            method: "DELETE",
          });
          const result = await response.json();

          if (response.ok) {
            showToastMessage(serviceActionMessage, "success", result.message);
            btn.closest(".service-card")?.remove();
          } else {
            showToastMessage(serviceActionMessage, "error", result.message);
          }
        } catch (error) {
          showToastMessage(
            serviceActionMessage,
            "error",
            "Network Error! Server se connect nahi ho paya.",
          );
        }
      }
    });
  }
});

//login data logic

const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("login-message");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const loginData = Object.fromEntries(formData.entries());

    try {
      const responce = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify(loginData),
      });
      const result = await responce.json();
      if (responce.ok) {
        showToastMessage(loginMessage, "success", result.message);
        setTimeout(() => window.location.href = "/", 1000);
      } else {
        showToastMessage(loginMessage, "error", result.message);
      }
    } catch (error) {
      showToastMessage(loginMessage, "error", error);
    }
  });
}

// ==========================================
// Quick Upload Modal Logic (Profile Pic / Resume)
// ==========================================
let currentUploadType = null; // 'profilePic' or 'resume'

window.openUploadModal = function(type) {
  currentUploadType = type;
  const modal = document.getElementById('quickUploadModal');
  const title = document.getElementById('uploadModalTitle');
  const fileInput = document.getElementById('quickFileInput');
  const statusMsg = document.getElementById('uploadStatusMsg');
  
  if (!modal) return;
  
  title.innerText = type === 'profilePic' ? 'Upload Profile Picture' : 'Upload Resume';
  fileInput.accept = type === 'profilePic' ? 'image/*' : '.pdf';
  fileInput.value = ''; // clear previous
  statusMsg.innerText = '';
  
  modal.style.display = 'flex';
};

window.closeUploadModal = function() {
  const modal = document.getElementById('quickUploadModal');
  if (modal) modal.style.display = 'none';
  currentUploadType = null;
};

window.submitQuickUpload = async function() {
  if (!currentUploadType) return;
  
  const fileInput = document.getElementById('quickFileInput');
  const statusMsg = document.getElementById('uploadStatusMsg');
  const btn = document.getElementById('quickUploadBtn');
  
  const globalMsg = document.getElementById('projectActionMessage') || document.getElementById('contactMessage'); 
  if (!fileInput.files || fileInput.files.length === 0) {
    showToastMessage(globalMsg, "error", 'Pehle ek file select karein!');
    return;
  }
  
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append(currentUploadType, file);
  
  btn.disabled = true;
  btn.innerText = 'Uploading...';
  
  try {
    const res = await fetch('/admin/uploadQuickFile', {
      method: 'POST',
      body: formData // Browser auto-sets multipart boundary
    });
    const result = await res.json();
    
    if (res.ok) {
      showToastMessage(globalMsg, "success", result.message);
      btn.innerText = 'Success ✓';
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showToastMessage(globalMsg, "error", result.message || 'Upload fail ho gaya.');
      btn.disabled = false;
      btn.innerText = 'Upload & Save';
    }
  } catch (error) {
    showToastMessage(globalMsg, "error", 'Network error. Upload failed.');
    btn.disabled = false;
    btn.innerText = 'Upload & Save';
  }
};
