'use strict';

// ─────────────────────────────────────────────────
// Auto-discovery — load TRACKS from metadata files
// ─────────────────────────────────────────────────
// How it works:
//   1. Read domain/manifest.json → list of track IDs
//   2. Read domain/track-id/track.json → track metadata (name, icon, domain)
//   3. Read domain/track-id/chapter-id/chapter.json → chapter metadata + problems
//
// Adding new content = create folder + JSON files. No code changes needed.

// Domain registry: maps folder name → domain key
const DOMAINS = [
  { path: 'cs',           domain: 'cs'   },
  { path: 'languages',    domain: 'lang' },
  { path: 'visualizations', domain: 'viz' }
];

const DOMAIN_LABELS = {
  all: 'Tất cả',
  cs: 'CS',
  lang: 'Ngôn ngữ',
  viz: 'Trực quan hóa',
  other: 'Khác'
};

// ─────────────────────────────────────────────────
// Discovery helpers
// ─────────────────────────────────────────────────

async function loadJSON(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function discoverChapters(trackPath) {
  const manifest = await loadJSON('../' + trackPath + '/manifest.json');
  if (!manifest || !manifest.chapters) return [];

  const chapters = [];
  for (const entry of manifest.chapters) {
    let meta;
    if (entry === 'README') {
      // Special case: README at track root level
      meta = await loadJSON(`../${trackPath}/README.json`);
    } else if (entry.endsWith('.md')) {
      // Entry is a markdown file (e.g. "intro.md")
      meta = await loadJSON(`../${trackPath}/${entry.replace('.md', '')}/README.json`);
    } else {
      // Entry is a folder (e.g. "01-fundamentals")
      meta = await loadJSON(`../${trackPath}/${entry}/chapter.json`)
           || await loadJSON(`../${trackPath}/${entry}/README.json`);
    }
    if (!meta) continue;

    chapters.push({
      name: meta.name || entry,
      path: (entry === 'README' || entry.endsWith('.md')) ? trackPath : `${trackPath}/${entry}`,
      readme: 'README.md',
      problems: (meta.problems || []).map(p => ({
        name: p.name,
        file: p.file,
        difficulty: p.difficulty || 'Medium',
        type: p.type || 'md'   // 'md' | 'viz'
      }))
    });
  }

  return chapters;
}

async function discoverTracks() {
  const tracks = [];

  for (const { path: domainPath, domain } of DOMAINS) {
    const manifest = await loadJSON('../' + domainPath + '/manifest.json');
    if (!manifest || !manifest.tracks) continue;

    for (const trackId of manifest.tracks) {
      const meta = await loadJSON(`../${domainPath}/${trackId}/track.json`);
      if (!meta) continue;

      const track = {
        id: trackId,
        name: meta.name,
        icon: meta.icon || '📁',
        domain: domain,
        path: `${domainPath}/${trackId}`,
        readme: 'README.md',
        chapters: []
      };

      track.chapters = await discoverChapters(track.path);
      tracks.push(track);
    }
  }

  return tracks;
}

// ─────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────
let TRACKS = [];
let activeDomain = 'all';
let currentView = 'list';   // 'list' | 'track'
let activeTrackId = null;
let openChapters = {};      // { [trackId]: Set<chapterIdx> }
let currentItem = null;     // { trackId, chapterIdx, problemIdx }
let progress = JSON.parse(localStorage.getItem('study_progress') || '{}');
let lastActivity = JSON.parse(localStorage.getItem('last_activity') || '{}');

// ─────────────────────────────────────────────────
// Theme (dark/light)
// ─────────────────────────────────────────────────
const STORAGE_KEY_THEME = 'study_theme';

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next);
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
  const hljsLink = document.getElementById('hljs-style');
  if (hljsLink) {
    hljsLink.href = theme === 'light'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  }
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

(function loadTheme() {
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  if (saved) applyTheme(saved);
})();

marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    return hljs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true
});

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

function domainClass(domain) {
  if (domain === 'cs') return 'cs';
  if (domain === 'lang') return 'lang';
  if (domain === 'viz') return 'viz';
  return 'other';
}

function countTrack(track) {
  let total = 0, done = 0;
  track.chapters.forEach((ch, ci) => {
    ch.problems.forEach((_, pi) => {
      const key = `${track.id}|${ci}|${pi}`;
      total++;
      if (progress[key]) done++;
    });
  });
  return { total, done };
}

function saveDone(key, val) {
  progress[key] = val;
  if (val) lastActivity[key] = Date.now();
  else delete lastActivity[key];
  localStorage.setItem('study_progress', JSON.stringify(progress));
  localStorage.setItem('last_activity', JSON.stringify(lastActivity));
  renderView();
}

// ─────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  const stats = document.getElementById('sidebarStats');

  let total = 0, done = 0;
  TRACKS.forEach(t => {
    const { total: t2, done: d2 } = countTrack(t);
    total += t2; done += d2;
  });
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  stats.innerHTML = `
    <div class="sidebar-stat">
      <span class="sidebar-stat-label">Hoàn thành</span>
      <span class="sidebar-stat-value done">${done} / ${total}</span>
    </div>
    <div class="sidebar-progress-bar">
      <div class="sidebar-progress-fill" style="width:${pct}%"></div>
    </div>`;

  nav.innerHTML = '';

  const presentDomains = [...new Set(TRACKS.map(t => t.domain))];
  for (const domain of presentDomains) {
    const tracks = TRACKS.filter(t => t.domain === domain);
    if (!tracks.length) continue;
    const label = DOMAIN_LABELS[domain] ?? domain;
    nav.innerHTML += `<div class="sidebar-section-label">${label}</div>`;
    tracks.forEach(t => nav.innerHTML += renderSidebarTrack(t));
  }
}

function renderSidebarTrack(track) {
  const { total, done } = countTrack(track);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isActive = activeTrackId === track.id ? ' active' : '';
  const dc = domainClass(track.domain);
  return `
    <div class="sidebar-track ${dc}${isActive}" onclick="goToTrack('${track.id}')">
      <div class="sidebar-track-icon ${dc}">${track.icon}</div>
      <div class="sidebar-track-info">
        <div class="sidebar-track-name">${track.name}</div>
      </div>
      ${pct > 0 ? `<span class="sidebar-track-badge">${pct}%</span>` : ''}
    </div>`;
}

// ─────────────────────────────────────────────────
// Tabs
// ─────────────────────────────────────────────────
function renderTabs() {
  const presentDomains = [...new Set(TRACKS.map(t => t.domain))];
  const domains = [
    { id: 'all', label: 'Tất cả' },
    ...presentDomains.map(d => ({ id: d, label: DOMAIN_LABELS[d] ?? d }))
  ];

  document.getElementById('tabs').innerHTML = domains.map(d => {
    const active = d.id === activeDomain ? 'active' : '';
    return `<button class="tab ${active}" data-domain="${d.id}" onclick="switchTab('${d.id}')">${d.label}</button>`;
  }).join('');
}

function switchTab(domain) {
  activeDomain = domain;
  goToList();
}

// ─────────────────────────────────────────────────
// View: Track list
// ─────────────────────────────────────────────────
function getTrackLastActivity(track) {
  let last = 0;
  track.chapters.forEach((ch, ci) => {
    ch.problems.forEach((_, pi) => {
      const key = `${track.id}|${ci}|${pi}`;
      if (lastActivity[key] && lastActivity[key] > last) last = lastActivity[key];
    });
  });
  return last;
}

function renderList() {
  const main = document.getElementById('main');
  const filtered = TRACKS.filter(t => activeDomain === 'all' || t.domain === activeDomain);

  filtered.sort((a, b) => {
    const aLast = getTrackLastActivity(a);
    const bLast = getTrackLastActivity(b);
    if (aLast === 0 && bLast === 0) return a.name.localeCompare(b.name);
    if (aLast === 0) return 1;
    if (bLast === 0) return -1;
    return bLast - aLast;
  });

  if (filtered.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div>Không có track nào trong mục này.</div>
      </div>`;
    return;
  }

  const label = DOMAIN_LABELS[activeDomain] || 'Tất cả chủ đề';

  main.innerHTML = `
    <div class="list-header">
      <h1>${label}</h1>
      <p>Chọn một track để bắt đầu học</p>
    </div>
    <div class="track-grid">
      ${filtered.map(track => {
        const { total, done } = countTrack(track);
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const dc = domainClass(track.domain);
        return `
          <div class="track-card ${dc}" onclick="goToTrack('${track.id}')">
            <div class="track-card-icon">${track.icon}</div>
            <div class="track-card-body">
              <div class="track-card-name">${track.name}</div>
              <div class="track-card-desc">${track.chapters.length} chương · ${total} bài tập</div>
            </div>
            <div class="track-card-footer">
              <span class="track-card-stat"><strong>${done}</strong> hoàn thành</span>
              <div class="track-card-progress">
                <div class="track-progress-bar">
                  <div class="track-progress-fill" style="width:${pct}%"></div>
                </div>
                <span class="track-card-pct">${pct}%</span>
              </div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

// ─────────────────────────────────────────────────
// View: Track detail
// ─────────────────────────────────────────────────
function renderTrackDetail() {
  const track = TRACKS.find(t => t.id === activeTrackId);
  if (!track) return;

  const { total, done } = countTrack(track);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const dc = domainClass(track.domain);

  if (!openChapters[track.id]) openChapters[track.id] = new Set();

  const chapterSections = track.chapters.map((ch, ci) => {
    const isOpen = openChapters[track.id].has(ci);
    const hasProblems = ch.problems.length > 0;
    const chapterDone = ch.problems.filter((_, pi) => !!progress[`${track.id}|${ci}|${pi}`]).length;

    const rows = hasProblems ? ch.problems.map((p, pi) => {
      const key = `${track.id}|${ci}|${pi}`;
      const isDone = !!progress[key];
      return `
        <div class="problem-row${isDone ? ' done' : ''}" onclick="openProblemViz('${track.id}',${ci},${pi})">
          <button class="check-btn${isDone ? ' done' : ''}" onclick="event.stopPropagation();toggleDone('${track.id}',${ci},${pi})">
            ${isDone ? '✓' : ''}
          </button>
          <div class="problem-name"><span>${p.name}</span></div>
          <div class="difficulty ${p.difficulty}">${p.difficulty}</div>
          <div class="problem-view">Xem →</div>
        </div>`;
    }).join('') : `<div class="chapter-empty" onclick="openProblemViz('${track.id}',${ci},-1)">
        <span>📝 Xem README chương này</span>
        <span class="chapter-overview-link">Xem →</span>
      </div>`;

    const isAllDone = hasProblems && chapterDone === ch.problems.length;
    return `
      <div class="chapter-section${isOpen ? ' open' : ''}">
        <div class="chapter-header" onclick="toggleChapter('${track.id}',${ci})">
          <div class="chapter-header-icon">📁</div>
          <div class="chapter-info">
            <div class="chapter-name">${ch.name}</div>
            ${hasProblems ? `<div class="chapter-meta">${chapterDone} / ${ch.problems.length} bài đã làm</div>` : ''}
          </div>
          ${hasProblems
            ? `<span class="chapter-progress-chip${isAllDone ? ' all-done' : ''}">${chapterDone}/${ch.problems.length}</span>`
            : ''}
          <span class="chapter-chevron">▼</span>
        </div>
        <div class="chapter-body">
          <div class="chapter-readme-row" onclick="event.stopPropagation();openProblemViz('${track.id}',${ci},-1)">
            <span class="chapter-readme-icon">📖</span>
            <span class="chapter-readme-label">Xem lý thuyết chương</span>
            <span class="chapter-readme-file">${ch.readme}</span>
            <span class="chapter-readme-arrow">→</span>
          </div>
          <div class="chapter-problem-list">${rows}</div>
        </div>
      </div>`;
  }).join('');

  const main = document.getElementById('main');

  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  main.innerHTML = `
    <div class="track-detail-hero ${dc}">
      <div class="track-detail-icon">${track.icon}</div>
      <div class="track-detail-info">
        <h2 class="track-detail-name">${track.name}</h2>
        <div class="track-detail-meta">
          <span>${total} bài</span>
          <span class="track-detail-meta-dot"></span>
          <span>${done} đã hoàn thành</span>
        </div>
      </div>
      <div class="track-detail-pct-block">
        <div class="track-detail-pct-ring">
          <svg viewBox="0 0 72 72">
            <circle class="ring-bg" cx="36" cy="36" r="${r}"/>
            <circle class="ring-fill" cx="36" cy="36" r="${r}"
              stroke-dasharray="${circ}"
              stroke-dashoffset="${offset}"/>
          </svg>
          <div class="track-detail-pct-text">${pct}%</div>
        </div>
        <div class="track-detail-pct-label">Hoàn thành</div>
      </div>
      <button class="readme-btn ${dc}" onclick="openProblemViz('${track.id}',0,-1)">
        README ↗
      </button>
    </div>
    <div class="chapters-list">
      ${chapterSections}
    </div>`;
}

function toggleChapter(trackId, chapterIdx) {
  if (!openChapters[trackId]) openChapters[trackId] = new Set();
  if (openChapters[trackId].has(chapterIdx)) {
    openChapters[trackId].delete(chapterIdx);
  } else {
    openChapters[trackId].add(chapterIdx);
  }
  renderTrackDetail();
}

// ─────────────────────────────────────────────────
// Mobile sidebar
// ─────────────────────────────────────────────────
let sidebarOpen = false;

function toggleMobileSidebar() {
  sidebarOpen = !sidebarOpen;
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebarOpen) {
    sidebar.classList.add('mobile-open');
    overlay.style.display = 'block';
  } else {
    sidebar.classList.remove('mobile-open');
    overlay.style.display = 'none';
  }
}

function closeMobileSidebar() {
  sidebarOpen = false;
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  sidebar.classList.remove('mobile-open');
  if (overlay) overlay.style.display = 'none';
}

function goToTrack(trackId) {
  activeTrackId = trackId;
  currentView = 'track';
  closeMobileSidebar();
  const track = TRACKS.find(t => t.id === trackId);
  openChapters[trackId] = new Set();
  if (track) {
    const first = track.chapters.findIndex(ch => ch.problems.length > 0);
    if (first >= 0) openChapters[trackId].add(first);
  }
  renderView();
}

function goToList() {
  activeTrackId = null;
  currentView = 'list';
  closeMobileSidebar();
  renderView();
}

function renderView() {
  renderSidebar();
  renderTopbar();
  renderTabs();
  if (currentView === 'track') {
    renderTrackDetail();
  } else {
    renderList();
  }
}

function renderTopbar() {
  const backBtn = document.getElementById('backBtn');
  const title = document.getElementById('topbarTitle');
  if (currentView === 'track') {
    const track = TRACKS.find(t => t.id === activeTrackId);
    backBtn.style.display = '';
    title.textContent = track ? `${track.icon} ${track.name}` : 'Chi tiết';
  } else {
    backBtn.style.display = 'none';
    title.textContent = '📚 Study Dashboard';
  }
}

// ─────────────────────────────────────────────────
// Toggle done
// ─────────────────────────────────────────────────
function toggleDone(trackId, chapterIdx, problemIdx) {
  const key = `${trackId}|${chapterIdx}|${problemIdx}`;
  const newVal = !progress[key];
  saveDone(key, newVal);
}

// ─────────────────────────────────────────────────
// Visualization helpers
// ─────────────────────────────────────────────────

// Detect repo path from current URL (works on both localhost and github.io)
function getRepoPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  // If path is like /learn-leetcode/dashboard/index.html → repo = /learn-leetcode
  // If path is like /dashboard/index.html → repo = ''
  if (parts.length >= 2 && parts[1] === 'dashboard') {
    return '/' + parts[0];
  }
  return '';
}

function openViz(vizPath) {
  const modal = document.getElementById('modal');
  const body = modal.querySelector('.modal-body');

  // Prepend repo path so it works on github.io subpath
  const repoPath = getRepoPath();
  const fullSrc = repoPath + vizPath;

  // Hide prev/next when viewing viz (no prev/next for HTML pages)
  document.getElementById('modalPrev').style.display = 'none';
  document.getElementById('modalNext').style.display = 'none';

  // Wider modal for viz content
  document.querySelector('.modal-box').classList.add('viz-modal');

  // Load viz in iframe
  body.innerHTML = `<iframe src="${fullSrc}" class="viz-iframe" sandbox="allow-scripts"></iframe>`;

  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function openProblemViz(trackId, chapterIdx, problemIdx) {
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) return;

  const ch = track.chapters[chapterIdx];
  const isReadme = problemIdx === -1;

  if (!isReadme) {
    const problem = ch.problems[problemIdx];
    if (problem.type === 'viz') {
      const dc = domainClass(track.domain);
      document.getElementById('modalDomain').className = `modal-domain ${dc}`;
      document.getElementById('modalDomain').textContent = DOMAIN_LABELS[track.domain] ?? track.domain.toUpperCase();
      document.getElementById('modalTitle').textContent = problem.name;
      openViz(problem.file);
      return;
    }
  }

  // Fall back to markdown modal
  openProblem(trackId, chapterIdx, problemIdx);
}

// ─────────────────────────────────────────────────
// Modal / Content
// ─────────────────────────────────────────────────
function openProblem(trackId, chapterIdx, problemIdx) {
  // Restore prev/next for markdown content
  document.getElementById('modalPrev').style.display = '';
  document.getElementById('modalNext').style.display = '';
  const iframe = document.querySelector('.viz-iframe');
  if (iframe) iframe.remove();
  document.querySelector('.modal-box').classList.remove('viz-modal');

  const track = TRACKS.find(t => t.id === trackId);
  if (!track) return;

  const ch = track.chapters[chapterIdx];
  currentItem = { trackId, chapterIdx, problemIdx };

  const isReadme = problemIdx === -1;

  let title;
  let targetFile;

  if (isReadme) {
    title = '📖 ' + (ch ? ch.name : track.name);
    targetFile = ch
      ? `../${ch.path}/${ch.readme}`
      : `../${track.path}/${track.readme}`;
  } else {
    title = ch.problems[problemIdx].name;
    targetFile = `../${ch.path}/${ch.problems[problemIdx].file}`;
  }

  const dc = domainClass(track.domain);
  const domainLabel = DOMAIN_LABELS[track.domain] ?? track.domain.toUpperCase();

  document.getElementById('modalDomain').className = `modal-domain ${dc}`;
  document.getElementById('modalDomain').textContent = domainLabel;
  document.getElementById('modalTitle').textContent = title;

  // Build all-items list (README + problems), skip viz items
  const allItems = [];
  track.chapters.forEach((c, ci) => {
    allItems.push({ ci, pi: -1, title: '📖 ' + c.name });
    c.problems.forEach((p, pi) => {
      if (p.type !== 'viz') {
        allItems.push({ ci, pi, title: p.name });
      }
    });
  });

  const curIdx = allItems.findIndex(it => it.ci === chapterIdx && it.pi === problemIdx);

  document.getElementById('modalPrev').disabled = curIdx <= 0;
  document.getElementById('modalNext').disabled = curIdx === allItems.length - 1 || allItems.length === 0;

  document.getElementById('modal').classList.add('show');
  document.body.style.overflow = 'hidden';
  document.getElementById('modal').querySelector('.modal-body').innerHTML = '<div class="preview-loading">⏳ Đang tải nội dung...</div>';

  loadContent(targetFile);
}

function loadContent(filePath) {
  fetch(filePath)
    .then(r => r.text())
    .then(md => {
      const html = marked.parse(md);
      const body = document.getElementById('modal').querySelector('.modal-body');
      body.innerHTML = `<div class="md-content">${html}</div>`;

      body.querySelectorAll('table').forEach(tbl => {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      });

      body.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));
    })
    .catch(() => {
      document.getElementById('modal').querySelector('.modal-body').innerHTML =
        `<div class="preview-loading">❌ Không tìm thấy file. Có thể nội dung chưa được tạo.</div>`;
    });
}

function navigateModal(dir) {
  if (!currentItem) return;
  const { trackId, chapterIdx, problemIdx } = currentItem;
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) return;

  const allItems = [];
  track.chapters.forEach((c, ci) => {
    allItems.push({ ci, pi: -1 });
    c.problems.forEach((p, pi) => {
      if (p.type !== 'viz') allItems.push({ ci, pi });
    });
  });

  const curIdx = allItems.findIndex(it => it.ci === chapterIdx && it.pi === problemIdx);
  const nextIdx = curIdx + dir;

  if (nextIdx >= 0 && nextIdx < allItems.length) {
    const next = allItems[nextIdx];
    openProblem(trackId, next.ci, next.pi);
  }
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
  document.body.style.overflow = '';
  currentItem = null;
  // Restore prev/next buttons for markdown content
  document.getElementById('modalPrev').style.display = '';
  document.getElementById('modalNext').style.display = '';
  // Remove iframe if any
  const iframe = document.querySelector('.viz-iframe');
  if (iframe) iframe.remove();
  document.querySelector('.modal-box').classList.remove('viz-modal');
}

// ─────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────
document.getElementById('modalPrev').addEventListener('click', () => navigateModal(-1));
document.getElementById('modalNext').addEventListener('click', () => navigateModal(1));
document.getElementById('modalClose').addEventListener('click', closeModal);

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') navigateModal(-1);
  if (e.key === 'ArrowRight') navigateModal(1);
});

async function init() {
  TRACKS = await discoverTracks();
  renderSidebar();
  renderTopbar();
  renderTabs();
  renderList();
}

init();
