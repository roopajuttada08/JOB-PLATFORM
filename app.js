// Job Platform - vanilla JS with localStorage persistence
// Two modes: Employer (post/manage jobs) and Candidate (browse/apply)

const STORAGE_KEY = "job_platform_jobs";
const APPLICATIONS_KEY = "job_platform_applications";

// ---------- Storage helpers ----------
function loadJobs() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveJobs(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}
function loadApplications() {
  try {
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY)) || [];
  } catch {
    return [];
  }
}
function saveApplications(apps) {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
}

// ---------- Seed sample data on first run ----------
function seedIfEmpty() {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    const sample = [
      {
        id: cryptoId(),
        title: "Frontend Developer",
        company: "Acme Corp",
        location: "Remote",
        type: "Full-time",
        salary: "₹8 LPA",
        description: "Build responsive UIs with HTML, CSS and JavaScript.",
        applied: false,
      },
      {
        id: cryptoId(),
        title: "Data Analyst Intern",
        company: "InsightLab",
        location: "Bengaluru",
        type: "Internship",
        salary: "₹25k / month",
        description: "Assist the analytics team with reporting and dashboards.",
        applied: false,
      },
    ];
    saveJobs(sample);
  }
}

function cryptoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- DOM refs ----------
const candidateBtn = document.getElementById("candidateBtn");
const employerBtn = document.getElementById("employerBtn");
const candidatePanel = document.getElementById("candidatePanel");
const employerPanel = document.getElementById("employerPanel");
const jobForm = document.getElementById("jobForm");
const jobList = document.getElementById("jobList");
const myJobs = document.getElementById("myJobs");
const searchInput = document.getElementById("search");
const filterType = document.getElementById("filterType");

// ---------- Mode switching ----------
candidateBtn.addEventListener("click", () => setMode("candidate"));
employerBtn.addEventListener("click", () => setMode("employer"));

function setMode(mode) {
  const isCandidate = mode === "candidate";
  candidatePanel.classList.toggle("hidden", !isCandidate);
  employerPanel.classList.toggle("hidden", isCandidate);
  candidateBtn.classList.toggle("active", isCandidate);
  employerBtn.classList.toggle("active", !isCandidate);
  render();
}

// ---------- Employer: create job ----------
jobForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const job = {
    id: cryptoId(),
    title: val("title"),
    company: val("company"),
    location: val("location"),
    type: val("type"),
    salary: val("salary"),
    description: val("description"),
    applied: false,
  };
  const jobs = loadJobs();
  jobs.unshift(job);
  saveJobs(jobs);
  jobForm.reset();
  render();
});

function val(id) {
  return document.getElementById(id).value.trim();
}

// ---------- Employer: delete job ----------
function deleteJob(id) {
  saveJobs(loadJobs().filter((j) => j.id !== id));
  render();
}

// ---------- Candidate: apply ----------
function applyJob(id) {
  const jobs = loadJobs();
  const job = jobs.find((j) => j.id === id);
  if (job) {
    job.applied = true;
    saveJobs(jobs);
    const apps = loadApplications();
    apps.push({ jobId: id, title: job.title, company: job.company, at: new Date().toISOString() });
    saveApplications(apps);
    render();
  }
}

// ---------- Filters ----------
searchInput.addEventListener("input", renderCandidateList);
filterType.addEventListener("change", renderCandidateList);

function getFilteredJobs() {
  const q = searchInput.value.toLowerCase();
  const type = filterType.value;
  return loadJobs().filter((j) => {
    const matchesText =
      !q ||
      [j.title, j.company, j.location, j.description].join(" ").toLowerCase().includes(q);
    const matchesType = !type || j.type === type;
    return matchesText && matchesType;
  });
}

// ---------- Rendering ----------
function jobCard(job, withApply, withDelete) {
  const div = document.createElement("div");
  div.className = "job";
  div.innerHTML = `
    <h3>${escapeHtml(job.title)}</h3>
    <div class="meta">${escapeHtml(job.company)} · ${escapeHtml(job.location || "N/A")}</div>
    <div>
      <span class="badge">${escapeHtml(job.type)}</span>
      ${job.salary ? `<span class="badge">${escapeHtml(job.salary)}</span>` : ""}
    </div>
    <p class="desc">${escapeHtml(job.description || "")}</p>
  `;
  if (withApply) {
    const btn = document.createElement("button");
    btn.className = "apply-btn";
    btn.textContent = job.applied ? "✓ Applied" : "Apply Now";
    btn.disabled = job.applied;
    btn.addEventListener("click", () => applyJob(job.id));
    div.appendChild(btn);
  }
  if (withDelete) {
    const btn = document.createElement("button");
    btn.className = "delete-btn";
    btn.textContent = "Delete";
    btn.addEventListener("click", () => deleteJob(job.id));
    div.appendChild(btn);
  }
  return div;
}

function renderCandidateList() {
  const jobs = getFilteredJobs();
  jobList.innerHTML = "";
  if (!jobs.length) {
    jobList.innerHTML = '<div class="empty">No jobs match your search.</div>';
    return;
  }
  jobs.forEach((j) => jobList.appendChild(jobCard(j, true, false)));
}

function renderEmployerList() {
  const jobs = loadJobs();
  myJobs.innerHTML = "";
  if (!jobs.length) {
    myJobs.innerHTML = '<div class="empty">You have not posted any jobs yet.</div>';
    return;
  }
  jobs.forEach((j) => myJobs.appendChild(jobCard(j, false, true)));
}

function render() {
  renderCandidateList();
  renderEmployerList();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------- Init ----------
seedIfEmpty();
render();
