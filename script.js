/* ===========================================================
   JOB DATA
   -----------------------------------------------------------
   Add, edit, or remove jobs by editing this array. Every job
   card and the job-details drawer are generated from this data
   — nothing job-specific is hard-coded elsewhere in the page.

   Fields you can fill in per job:
     id             — unique string, used internally
     title          — shown on the card, drawer, and application form
     location       — e.g. "Bangladesh — Remote"
     type           — employment type, e.g. "Full-time"
     pay            — short pay line shown on the card, e.g. "$15–$20 / day"
     hours          — e.g. "8 hours per day"
     schedule       — shift/scheduling note
     experience     — experience requirement note
     eligibility    — who can apply
     description    — short paragraph shown on the card and drawer
     requirements   — array of strings, or null to omit the section
     responsibilities — array of strings, or null to omit the section
     benefits      — array of strings, or null to omit the section
     shiftOptions   — array of shift-block labels the applicant can choose
                       from on the application form, or null if this role
                       has a fixed schedule (hides the field entirely)
   Leave a field as null (not an empty string) to hide that
   section entirely rather than showing it empty.
   =========================================================== */

const jobs = [
  {
    id: "virtual-assistant-remote",
    title: "Virtual Assistant (Remote)",
    location: "Remote",
    type: "Full-Time",
    pay: "25–35k BDT",
    hours: "8-hour shift (Day)",
    schedule: "8-hour shift (Day)",
    experience: "No experience required—freshers and experienced candidates are both encouraged to apply",
    eligibility: "Freshers and experienced candidates are both encouraged to apply",
    description:
      "We are looking for a Virtual Assistant (Remote) to join our team. The candidate will handle data entry, scheduling, communication, and research tasks.",
    requirements: [
      "Fluent in English",
      "Skills in data entry",
      "Skills in scheduling",
      "Skills in communication",
      "Skills in research",
      "No experience required—freshers and experienced candidates are both encouraged to apply"
    ],

    // Shift blocks the applicant can pick from on the application form.
    // Set to null (instead of an array) for jobs with a fixed schedule —
    // the shift-selection field is hidden automatically when this is null.
    shiftOptions: null,

    responsibilities: null,
    benefits: null
  }
];


/* ===========================================================
   HELPERS
   =========================================================== */

const $ = (sel, scope = document) => scope.querySelector(sel); const $$ = (sel, scope = document) => Array.from(scope.querySelectorAll(sel));

function el(tag, opts = {}) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.html) node.innerHTML = opts.html;
  return node;
}


/* ===========================================================
   NAV: mobile menu + smooth scroll + close on link click
   =========================================================== */

const navToggle = $("#nav-toggle");
const mobileMenu = $("#mobile-menu");  navToggle.addEventListener("click", () => {   const isOpen = mobileMenu.classList.toggle("open");   navToggle.setAttribute("aria-expanded", String(isOpen)); });  $$('a[data-scroll], .mobile-menu a').forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});


/* ===========================================================
   RENDER JOB CARDS
   =========================================================== */

const jobGrid = $("#job-grid");

function renderJobCards() {
  jobGrid.innerHTML = "";

  if (jobs.length === 0) {
    jobGrid.appendChild(
      el("p", { text: "There are no open positions right now. Please check back soon." })
    );
    return;
  }

  jobs.forEach((job) => {
    const card = el("div", { class: "job-card" });

    const top = el("div", { class: "job-card-top" });
    top.appendChild(el("h3", { text: job.title }));
    if (job.pay) top.appendChild(el("span", { class: "job-pay", text: job.pay }));
    card.appendChild(top);

    const meta = el("div", { class: "job-meta" });
    [job.location, job.type, job.hours].filter(Boolean).forEach((m) => {
      meta.appendChild(el("span", { class: "job-tag", text: m }));
    });
    card.appendChild(meta);

    if (job.description) {
      card.appendChild(el("p", { class: "job-desc", text: job.description }));
    }

    const actions = el("div", { class: "job-card-actions" });

    const detailsBtn = el("button", { class: "btn btn-ghost", text: "View details" });
    detailsBtn.type = "button";
    detailsBtn.addEventListener("click", () => openDrawer(job.id));

    const applyBtn = el("button", { class: "btn btn-primary", text: "Apply now" });
    applyBtn.type = "button";
    applyBtn.addEventListener("click", () => openApplyModal(job.id));

    actions.appendChild(detailsBtn);
    actions.appendChild(applyBtn);
    card.appendChild(actions);

    jobGrid.appendChild(card);
  });
}


/* ===========================================================
   JOB DETAILS DRAWER
   =========================================================== */

const drawerOverlay = $("#drawer-overlay");
const jobDrawer = $("#job-drawer");
const drawerContent = $("#drawer-content");
const drawerCloseBtn = $("#drawer-close");

function buildDrawerContent(job) {
  drawerContent.innerHTML = "";

  drawerContent.appendChild(el("h2", { id: "drawer-title", text: job.title }));
  if (job.pay) drawerContent.appendChild(el("span", { class: "job-pay", text: job.pay }));

  const meta = el("div", { class: "drawer-meta" });
  [job.location, job.type, job.hours].filter(Boolean).forEach((m) => {
    meta.appendChild(el("span", { class: "job-tag", text: m }));
  });
  drawerContent.appendChild(meta);

  const overviewFacts = [
    ["Working hours", job.hours],
    ["Work schedule", job.schedule],
    ["Experience", job.experience],
    ["Eligibility", job.eligibility]
  ].filter(([, value]) => Boolean(value));

  if (overviewFacts.length) {
    const block = el("div", { class: "drawer-block" });
    block.appendChild(el("h4", { text: "Overview" }));
    const list = el("ul");

    overviewFacts.forEach(([label, value]) => {
      list.appendChild(el("li", { text: `${label}: ${value}` }));
    });

    block.appendChild(list);
    drawerContent.appendChild(block);
  }

  if (job.description) {
    const block = el("div", { class: "drawer-block" });
    block.appendChild(el("h4", { text: "About the role" }));
    block.appendChild(el("p", { text: job.description }));
    drawerContent.appendChild(block);
  }

  appendListBlock(drawerContent, "Responsibilities", job.responsibilities);
  appendListBlock(drawerContent, "Requirements", job.requirements);
  appendListBlock(drawerContent, "Benefits", job.benefits);

  const applyBtn = el("button", {
    class: "btn btn-primary btn-block btn-lg drawer-apply-btn",
    text: "Apply now"
  });

  applyBtn.type = "button";

  applyBtn.addEventListener("click", () => {
    closeDrawer();
    openApplyModal(job.id);
  });

  drawerContent.appendChild(applyBtn);
}


// Renders a titled section for an array field, or an
// "information not yet available" note when the field is null.
function appendListBlock(container, title, items) {
  const block = el("div", { class: "drawer-block" });
  block.appendChild(el("h4", { text: title }));

  if (Array.isArray(items) && items.length) {
    const list = el("ul");

    items.forEach((item) => {
      list.appendChild(el("li", { text: item }));
    });

    block.appendChild(list);
    container.appendChild(block);
    return;
  }

  // items is null/undefined -> not yet provided, omit the section entirely
}

function openDrawer(jobId) {
  const job = jobs.find((j) => j.id === jobId);
  if (!job) return;

  buildDrawerContent(job);
  drawerOverlay.classList.add("open");
  jobDrawer.classList.add("open");
  document.body.classList.add("no-scroll");
}

function closeDrawer() {
  drawerOverlay.classList.remove("open");
  jobDrawer.classList.remove("open");

  if (!applyModal.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

drawerCloseBtn.addEventListener("click", closeDrawer);

drawerOverlay.addEventListener("click", () => {
  closeDrawer();
  closeApplyModal();
});


/* ===========================================================
   APPLICATION MODAL
   =========================================================== */

const modalOverlay = $("#modal-overlay");
const applyModal = $("#apply-modal");
const modalCloseBtn = $("#modal-close");
const applyForm = $("#apply-form");
const positionInput = $("#f-position");
const shiftField = $("#shift-field");
const shiftSelect = $("#f-shift");

let currentJobId = null;

function openApplyModal(jobId) {
  const job = jobs.find((j) => j.id === jobId);

  currentJobId = jobId;
  positionInput.value = job ? job.title : "";

  // Show the shift-selection dropdown only for jobs that define
  // shiftOptions; otherwise hide and clear it so it doesn't block
  // submission for jobs with a fixed schedule.
  clearFieldError("f-shift");
  shiftSelect.classList.remove("invalid");

  if (job && Array.isArray(job.shiftOptions) && job.shiftOptions.length) {
    shiftSelect.innerHTML =
      '<option value="" disabled selected>Select an 8-hour shift</option>';

    job.shiftOptions.forEach((option) => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      shiftSelect.appendChild(opt);
    });

    shiftField.hidden = false;
    shiftSelect.required = true;
  } else {
    shiftField.hidden = true;
    shiftSelect.required = false;
    shiftSelect.value = "";
  }

  modalOverlay.classList.add("open");
  applyModal.classList.add("open");
  document.body.classList.add("no-scroll");

  setTimeout(() => $("#f-name").focus(), 250);
}

function closeApplyModal() {
  modalOverlay.classList.remove("open");
  applyModal.classList.remove("open");

  if (!jobDrawer.classList.contains("open")) {
    document.body.classList.remove("no-scroll");
  }
}

modalCloseBtn.addEventListener("click", closeApplyModal);

modalOverlay.addEventListener("click", () => {
  closeApplyModal();
  closeDrawer();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeDrawer();
    closeApplyModal();
  }
});


/* ===========================================================
   CV UPLOAD (drag & drop + click to browse)
   =========================================================== */

const dropzone = $("#dropzone");
const cvInput = $("#f-cv");
const dropzoneEmpty = $("#dropzone-empty");
const dropzoneFile = $("#dropzone-file");
const fileNameEl = $("#file-name");
const fileRemoveBtn = $("#file-remove");

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

let selectedFile = null;

dropzone.addEventListener("click", (e) => {
  if (e.target === fileRemoveBtn) return;
  cvInput.click();
});

dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    cvInput.click();
  }
});

["dragenter", "dragover"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((evt) => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

cvInput.addEventListener("change", () => {
  const file = cvInput.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();

  clearFieldError("f-cv");
  dropzone.classList.remove("invalid");

  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    setFieldError("f-cv", "Please upload a PDF, DOC, or DOCX file.");
    dropzone.classList.add("invalid");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    setFieldError("f-cv", "File is too large. Maximum size is 5MB.");
    dropzone.classList.add("invalid");
    return;
  }

  selectedFile = file;
  fileNameEl.textContent = file.name;
  dropzoneEmpty.hidden = true;
  dropzoneFile.hidden = false;
}

fileRemoveBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  selectedFile = null;
  cvInput.value = "";
  dropzoneFile.hidden = true;
  dropzoneEmpty.hidden = false;
});


/* ===========================================================
   FORM VALIDATION + SUBMISSION
   =========================================================== */

const submitBtn = $("#submit-btn");
const submitBtnText = $("#submit-btn-text");

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = $(`[data-error-for="${fieldId}"]`);

  if (input) input.classList.add("invalid");
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = $(`[data-error-for="${fieldId}"]`);

  if (input) input.classList.remove("invalid");
  if (errorEl) errorEl.textContent = "";
}

function validateForm() {
  let valid = true;

  const name = $("#f-name").value.trim();
  clearFieldError("f-name");

  if (!name) {
    setFieldError("f-name", "Please enter your full name.");
    valid = false;
  }

  const email = $("#f-email").value.trim();
  clearFieldError("f-email");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    setFieldError("f-email", "Please enter your email address.");
    valid = false;
  } else if (!emailPattern.test(email)) {
    setFieldError("f-email", "Please enter a valid email address.");
    valid = false;
  }

  const phone = $("#f-phone").value.trim();
  clearFieldError("f-phone");

  const phonePattern = /^[0-9+\-()\s]{6,20}$/;

  if (!phone) {
    setFieldError("f-phone", "Please enter your phone number.");
    valid = false;
  } else if (!phonePattern.test(phone)) {
    setFieldError("f-phone", "Please enter a valid phone number.");
    valid = false;
  }

  const location = $("#f-location").value.trim();
  clearFieldError("f-location");

  if (!location) {
    setFieldError("f-location", "Please enter your location or city.");
    valid = false;
  }

  clearFieldError("f-shift");
  shiftSelect.classList.remove("invalid");

  if (shiftSelect.required && !shiftSelect.value) {
    setFieldError("f-shift", "Please select your preferred shift.");
    shiftSelect.classList.add("invalid");
    valid = false;
  }

  clearFieldError("f-cv");
  dropzone.classList.remove("invalid");

  if (!selectedFile) {
    setFieldError("f-cv", "Please upload your CV or resume.");
    dropzone.classList.add("invalid");
    valid = false;
  }

  return valid;
}

applyForm.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) {
    const firstError = $(".invalid, .dropzone.invalid");

    if (firstError) {
      firstError.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    return;
  }

  // Collect the application payload. Structured this way so a real
  // backend/API call can be dropped in here later without touching
  // any of the UI or validation code above.
  const application = {
    jobId: currentJobId,
    jobTitle: positionInput.value,
    fullName: $("#f-name").value.trim(),
    email: $("#f-email").value.trim(),
    phone: $("#f-phone").value.trim(),
    location: $("#f-location").value.trim(),
    shiftPreference: shiftField.hidden ? null : shiftSelect.value,
    coverNote: $("#f-cover").value.trim(),
    cvFileName: selectedFile ? selectedFile.name : null
  };

  submitApplication(application);
});


// Placeholder submission handler. This is a frontend-only flow:
// no data is stored or sent anywhere yet. Replace the inside of
// this function with a real fetch()/API call when a backend is
// ready — the rest of the form does not need to change.
function submitApplication(application) {
  submitBtn.disabled = true;
  submitBtnText.innerHTML =
    '<span class="spinner" aria-hidden="true"></span> Submitting application...';

  setTimeout(() => {
    window.location.href = "thankyou.html";
  }, 1500);
}


/* ===========================================================
   MISC
   =========================================================== */

$("#year").textContent = new Date().getFullYear();

renderJobCards();