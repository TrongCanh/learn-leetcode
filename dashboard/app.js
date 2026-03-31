'use strict';

// ─────────────────────────────────────────────────
// CONFIG — khai báo tracks tại đây
// ─────────────────────────────────────────────────
// Cấu trúc mỗi track:
//   id       : unique key (dùng cho localStorage)
//   name     : tên hiển thị trên card
//   icon     : emoji icon
//   domain   : 'cs' | 'lang' | 'other'
//   path     : đường dẫn folder (từ root repo, không có trailing slash)
//   readme   : file README (từ thư mục track, ví dụ: 'README.md')
//   chapters : mảng các chương
//     .name   : tên chương
//     .path   : đường dẫn chapter (từ root repo)
//     .readme : file README trong chapter
//     .problems: mảng bài tập
//       .name      : tên bài
//       .file      : file .md (từ thư mục chapter)
//       .difficulty: 'Easy' | 'Medium' | 'Hard'

const TRACKS = [
  {
    id: 'neetcode-75',
    name: 'NeetCode 75',
    icon: '🧠',
    domain: 'cs',
    path: 'cs/neetcode-75',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Concepts & Patterns',
        path: 'cs/neetcode-75',
        readme: 'README.md',
        problems: []
      },
      {
        name: 'Arrays & Hashing',
        path: 'cs/neetcode-75/01-arrays-hashing',
        readme: 'README.md',
        problems: [
          { name: 'Contains Duplicate',      file: '001-contains-duplicate.md',          difficulty: 'Easy' },
          { name: 'Valid Anagram',            file: '002-valid-anagram.md',                difficulty: 'Easy' },
          { name: 'Two Sum',                  file: '003-two-sum.md',                      difficulty: 'Easy' },
          { name: 'Group Anagrams',           file: '004-group-anagrams.md',                 difficulty: 'Medium' },
          { name: 'Top K Frequent Elements', file: '005-top-k-frequent-elements.md',       difficulty: 'Medium' },
          { name: 'Product Except Self',     file: '006-product-of-array-except-self.md',  difficulty: 'Medium' },
          { name: 'Valid Sudoku',             file: '007-valid-sudoku.md',                   difficulty: 'Medium' },
          { name: 'Encode/Decode Strings',   file: '008-encode-decode-strings.md',         difficulty: 'Medium' },
        ]
      },
      {
        name: 'Two Pointers & Stack',
        path: 'cs/neetcode-75/02-two-pointers-stack',
        readme: 'README.md',
        problems: [
          { name: 'Valid Parentheses',          file: '001-valid-parentheses.md',            difficulty: 'Easy' },
          { name: 'Longest Substring',          file: '002-longest-substring.md',             difficulty: 'Medium' },
          { name: 'Container With Most Water',  file: '003-container-with-most-water.md',    difficulty: 'Medium' },
          { name: 'Backspace String Compare',   file: '004-backspace-string-compare.md',     difficulty: 'Easy' },
          { name: 'Valid Palindrome',          file: '005-valid-palindrome.md',             difficulty: 'Easy' },
          { name: 'Remove Duplicates',         file: '006-remove-duplicates.md',             difficulty: 'Easy' },
          { name: '3Sum',                      file: '007-3sum.md',                          difficulty: 'Medium' },
          { name: 'Trapping Rain Water',      file: '008-trapping-rain-water.md',          difficulty: 'Hard' },
        ]
      },
      {
        name: 'Sliding Window & Binary Search',
        path: 'cs/neetcode-75/03-sliding-window-binary-search',
        readme: 'README.md',
        problems: [
          { name: 'Binary Search',               file: '001-binary-search.md',             difficulty: 'Easy' },
          { name: 'Search 2D Matrix',             file: '002-search-2d-matrix.md',           difficulty: 'Medium' },
          { name: 'Koko Eating Bananas',          file: '003-koko-eating-bananas.md',       difficulty: 'Medium' },
          { name: 'Find Min Rotated Array',       file: '004-find-min-rotated-array.md',   difficulty: 'Medium' },
          { name: 'Search Rotated Array',        file: '005-search-rotated-array.md',      difficulty: 'Medium' },
          { name: 'Max Average Subarray',         file: '006-max-average-subarray.md',       difficulty: 'Easy' },
          { name: 'Max Vowels Substring',        file: '007-max-vowels-substring.md',      difficulty: 'Medium' },
          { name: 'Longest Subarray 1\'s',      file: '008-longest-subarray-ones.md',    difficulty: 'Medium' },
        ]
      },
      {
        name: 'Linked List & Trees',
        path: 'cs/neetcode-75/04-linked-list-trees',
        readme: 'README.md',
        problems: [
          { name: 'Reverse Linked List',    file: '001-reverse-linked-list.md',      difficulty: 'Easy' },
          { name: 'Merge Two Sorted Lists', file: '002-merge-two-sorted-lists.md',  difficulty: 'Easy' },
          { name: 'Reorder List',           file: '003-reorder-list.md',             difficulty: 'Medium' },
          { name: 'Remove Nth Node',        file: '004-remove-nth-node.md',         difficulty: 'Medium' },
          { name: 'Maximum Depth',          file: '005-maximum-depth.md',             difficulty: 'Easy' },
          { name: 'Invert Tree',            file: '006-invert-tree.md',               difficulty: 'Easy' },
          { name: 'Same Tree',              file: '007-same-tree.md',                 difficulty: 'Easy' },
          { name: 'Subtree',               file: '008-subtree.md',                   difficulty: 'Easy' },
          { name: 'Lowest Common Ancestor', file: '009-lowest-common-ancestor.md',  difficulty: 'Medium' },
        ]
      },
      {
        name: 'Trie & Heap',
        path: 'cs/neetcode-75/05-trie-heap',
        readme: 'README.md',
        problems: [
          { name: 'Implement Trie',          file: '001-implement-trie.md',     difficulty: 'Medium' },
          { name: 'Design Search Words',      file: '002-design-search-words.md',  difficulty: 'Medium' },
          { name: 'Kth Largest in Stream',  file: '003-kth-largest.md',         difficulty: 'Easy' },
          { name: 'Top K Frequent',          file: '004-top-k-frequent.md',        difficulty: 'Medium' },
          { name: 'Median Data Stream',       file: '005-median-data-stream.md',   difficulty: 'Medium' },
          { name: 'Merge K Sorted Lists',    file: '006-merge-k-sorted.md',       difficulty: 'Hard' },
        ]
      },
      {
        name: 'Dynamic Programming',
        path: 'cs/neetcode-75/06-dynamic-programming',
        readme: 'README.md',
        problems: [
          { name: 'Climbing Stairs',           file: '001-climbing-stairs.md',     difficulty: 'Easy' },
          { name: 'Min Cost Climbing',         file: '002-min-cost-climbing.md',   difficulty: 'Easy' },
          { name: 'House Robber',              file: '003-house-robber.md',        difficulty: 'Medium' },
          { name: 'Longest Palindromic',      file: '004-longest-palindromic.md', difficulty: 'Medium' },
          { name: 'Coin Change',               file: '005-coin-change.md',          difficulty: 'Medium' },
          { name: 'Longest Increasing Subseq', file: '006-longest-increasing.md', difficulty: 'Medium' },
        ]
      },
      {
        name: 'Graphs',
        path: 'cs/neetcode-75/07-graphs',
        readme: 'README.md',
        problems: [
          { name: 'Number of Islands',       file: '001-number-of-islands.md',     difficulty: 'Medium' },
          { name: 'Clone Graph',              file: '002-clone-graph.md',          difficulty: 'Medium' },
          { name: 'Pacific Atlantic',        file: '003-pacific-atlantic.md',    difficulty: 'Medium' },
          { name: 'Course Schedule',          file: '004-course-schedule.md',      difficulty: 'Medium' },
          { name: 'Number of Components',     file: '005-number-of-components.md', difficulty: 'Medium' },
          { name: 'Rotting Oranges',         file: '006-rotting-oranges.md',      difficulty: 'Medium' },
          { name: 'Keys and Rooms',           file: '007-keys-and-rooms.md',       difficulty: 'Easy' },
          { name: 'Accounts Merge',          file: '008-accounts-merge.md',       difficulty: 'Medium' },
          { name: 'Minimum Knight Moves',    file: '009-minimum-knight-moves.md', difficulty: 'Medium' },
          { name: 'Reorder Routes',          file: '010-reorder-routes.md',       difficulty: 'Medium' },
        ]
      },
      {
        name: 'Intervals, Backtracking & Math',
        path: 'cs/neetcode-75/08-intervals-backtracking-math',
        readme: 'README.md',
        problems: [
          { name: 'Insert Interval',           file: '001-insert-interval.md',        difficulty: 'Hard' },
          { name: 'Merge Intervals',           file: '002-merge-intervals.md',        difficulty: 'Medium' },
          { name: 'Non-overlapping Intervals', file: '003-non-overlapping-intervals.md', difficulty: 'Medium' },
          { name: 'Meeting Rooms',              file: '004-meeting-rooms.md',           difficulty: 'Medium' },
          { name: 'Meeting Rooms II',         file: '005-meeting-rooms-ii.md',       difficulty: 'Medium' },
          { name: 'Subsets',                  file: '006-subsets.md',                 difficulty: 'Medium' },
          { name: 'Combination Sum',          file: '007-combination-sum.md',        difficulty: 'Medium' },
          { name: 'Permutations',              file: '008-permutations.md',            difficulty: 'Medium' },
          { name: 'Subsets II',               file: '009-subsets-ii.md',             difficulty: 'Medium' },
          { name: 'Permutations II',           file: '010-permutations-ii.md',       difficulty: 'Medium' },
          { name: 'Combination Sum II',       file: '011-combination-sum-ii.md',    difficulty: 'Medium' },
          { name: 'Power of Two',             file: '012-power-of-two.md',           difficulty: 'Easy' },
          { name: 'Number of 1 Bits',         file: '013-number-of-1-bits.md',     difficulty: 'Easy' },
          { name: 'Count Primes',             file: '014-count-primes.md',          difficulty: 'Medium' },
          { name: 'Rotate Image',             file: '015-rotate-image.md',         difficulty: 'Medium' },
        ]
      }
    ]
  },

  {
    id: 'socket-programming',
    name: 'Socket Programming',
    icon: '🔌',
    domain: 'cs',
    path: 'cs/socket-programming',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Overview',
        path: 'cs/socket-programming',
        readme: 'README.md',
        problems: []
      },
      {
        name: '01 — Fundamentals',
        path: 'cs/socket-programming/01-fundamentals',
        readme: 'README.md',
        problems: [
          { name: 'Network Basics',       file: '001-network-basics.md',    difficulty: 'Easy' },
          { name: 'TCP vs UDP',           file: '002-tcp-vs-udp.md',        difficulty: 'Easy' },
          { name: 'Socket API',           file: '003-socket-api.md',        difficulty: 'Medium' },
          { name: 'OSI Model',           file: '004-osi-model.md',        difficulty: 'Easy' },
        ]
      },
      {
        name: '02 — TCP Sockets',
        path: 'cs/socket-programming/02-tcp-sockets',
        readme: 'README.md',
        problems: [
          { name: 'TCP Server',           file: '005-tcp-server.md',       difficulty: 'Medium' },
          { name: 'TCP Client',           file: '006-tcp-client.md',       difficulty: 'Medium' },
          { name: 'TCP State Diagram',    file: '007-tcp-state-diagram.md', difficulty: 'Hard' },
        ]
      },
      {
        name: '03 — UDP Sockets',
        path: 'cs/socket-programming/03-udp-sockets',
        readme: 'README.md',
        problems: [
          { name: 'UDP Server',              file: '008-udp-server.md',             difficulty: 'Medium' },
          { name: 'UDP Client',              file: '009-udp-client.md',             difficulty: 'Medium' },
          { name: 'Broadcast & Multicast',   file: '010-broadcast-multicast.md',   difficulty: 'Hard' },
        ]
      },
      {
        name: '04 — Advanced',
        path: 'cs/socket-programming/04-advanced',
        readme: 'README.md',
        problems: [
          { name: 'Non-blocking I/O',    file: '011-non-blocking-io.md',   difficulty: 'Hard' },
          { name: 'Socket Options',     file: '012-socket-options.md',    difficulty: 'Medium' },
          { name: 'IPv6',               file: '013-ipv6.md',              difficulty: 'Medium' },
          { name: 'Socket Security',    file: '014-socket-security.md',   difficulty: 'Medium' },
        ]
      },
      {
        name: '05 — Real-World',
        path: 'cs/socket-programming/05-real-world',
        readme: 'README.md',
        problems: [
          { name: 'HTTP & WebSocket',       file: '015-http-websocket.md',    difficulty: 'Medium' },
          { name: 'RPC & gRPC',             file: '016-rpc-grpc.md',          difficulty: 'Hard' },
          { name: 'Performance Tuning',     file: '017-performance-tuning.md', difficulty: 'Hard' },
        ]
      },
    ]
  },

  {
    id: 'design-patterns',
    name: 'Design Patterns',
    icon: '🏗️',
    domain: 'cs',
    path: 'cs/design-patterns',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Overview',
        path: 'cs/design-patterns',
        readme: 'README.md',
        problems: []
      },
      {
        name: 'Creational Patterns',
        path: 'cs/design-patterns/01-creational-patterns',
        readme: 'README.md',
        problems: [
          { name: 'Singleton',          file: '001-singleton.md',        difficulty: 'Easy' },
          { name: 'Factory Method',      file: '002-factory-method.md',  difficulty: 'Easy' },
          { name: 'Builder',             file: '003-builder.md',         difficulty: 'Easy' },
        ]
      },
      {
        name: 'Structural Patterns',
        path: 'cs/design-patterns/02-structural-patterns',
        readme: 'README.md',
        problems: [
          { name: 'Adapter',            file: '004-adapter.md',         difficulty: 'Medium' },
          { name: 'Facade',             file: '005-facade.md',          difficulty: 'Medium' },
          { name: 'Decorator',           file: '006-decorator.md',       difficulty: 'Medium' },
        ]
      },
      {
        name: 'Behavioral Patterns',
        path: 'cs/design-patterns/03-behavioral-patterns',
        readme: 'README.md',
        problems: [
          { name: 'Observer',           file: '007-observer.md',        difficulty: 'Easy' },
          { name: 'Strategy',           file: '008-strategy.md',        difficulty: 'Easy' },
          { name: 'Command',            file: '009-command.md',          difficulty: 'Medium' },
        ]
      },
      {
        name: 'State & Template & Proxy',
        path: 'cs/design-patterns/04-state-template-proxy',
        readme: 'README.md',
        problems: [
          { name: 'State',             file: '010-state.md',           difficulty: 'Medium' },
          { name: 'Template Method',   file: '011-template-method.md',  difficulty: 'Medium' },
          { name: 'Proxy',             file: '012-proxy.md',            difficulty: 'Medium' },
        ]
      }
    ]
  },

  {
    id: 'database',
    name: 'Database',
    icon: '🗄️',
    domain: 'cs',
    path: 'cs/database',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Overview',
        path: 'cs/database',
        readme: 'README.md',
        problems: []
      }
    ]
  },

  {
    id: 'typescript',
    name: 'TypeScript',
    icon: '🟦',
    domain: 'cs',
    path: 'cs/typescript',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Overview',
        path: 'cs/typescript',
        readme: 'README.md',
        problems: []
      }
    ]
  },

  {
    id: 'english',
    name: 'English',
    icon: '🇬🇧',
    domain: 'lang',
    path: 'languages/english',
    readme: 'README.md',
    chapters: [
      {
        name: '📖 Overview',
        path: 'languages/english',
        readme: 'README.md',
        problems: []
      }
    ]
  }
];

// ─────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────
let activeDomain = 'all';
let currentView = 'list';   // 'list' | 'track'
let activeTrackId = null;   // track đang mở chi tiết
let openChapters = {};      // { [trackId]: Set<chapterIdx> }
let currentItem = null;     // { trackId, chapterIdx, problemIdx }
let progress = JSON.parse(localStorage.getItem('study_progress') || '{}');

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
  // Update toggle icon
  const icon = document.getElementById('themeIcon');
  if (icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
  // Switch hljs stylesheet
  const hljsLink = document.getElementById('hljs-style');
  if (hljsLink) {
    hljsLink.href = theme === 'light'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css';
  }
  localStorage.setItem(STORAGE_KEY_THEME, theme);
}

// Apply saved theme on load
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
const DOMAIN_LABELS = { all: 'Tất cả', cs: 'CS', lang: 'Ngôn ngữ', other: 'Khác' };

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
  localStorage.setItem('study_progress', JSON.stringify(progress));
  renderView();
}

// ─────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────
function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  const stats = document.getElementById('sidebarStats');

  // Stats
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

  // Nav: group by domain
  const csTracks = TRACKS.filter(t => t.domain === 'cs');
  const langTracks = TRACKS.filter(t => t.domain === 'lang');

  nav.innerHTML = '';

  if (csTracks.length) {
    nav.innerHTML += `<div class="sidebar-section-label">Computer Science</div>`;
    csTracks.forEach(t => nav.innerHTML += renderSidebarTrack(t));
  }
  if (langTracks.length) {
    nav.innerHTML += `<div class="sidebar-section-label">Ngôn ngữ</div>`;
    langTracks.forEach(t => nav.innerHTML += renderSidebarTrack(t));
  }
}

function renderSidebarTrack(track) {
  const { total, done } = countTrack(track);
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const isActive = activeTrackId === track.id ? ' active' : '';
  return `
    <div class="sidebar-track ${track.domain}${isActive}" onclick="goToTrack('${track.id}')">
      <div class="sidebar-track-icon ${track.domain}">${track.icon}</div>
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
  const domains = [
    { id: 'all', label: 'Tất cả' },
    { id: 'cs', label: '💻 CS' },
    { id: 'lang', label: '🌐 Ngôn ngữ' },
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
function renderList() {
  const main = document.getElementById('main');
  const filtered = TRACKS.filter(t => activeDomain === 'all' || t.domain === activeDomain);

  if (filtered.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div>Không có track nào trong mục này.</div>
      </div>`;
    return;
  }

  const label = activeDomain === 'cs' ? 'Computer Science'
    : activeDomain === 'lang' ? 'Ngôn ngữ'
    : 'Tất cả chủ đề';

  main.innerHTML = `
    <div class="list-header">
      <h1>${label}</h1>
      <p>Chọn một track để bắt đầu học</p>
    </div>
    <div class="track-grid">
      ${filtered.map(track => {
        const { total, done } = countTrack(track);
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const iconClass = track.domain === 'cs' ? 'cs' : track.domain === 'lang' ? 'lang' : 'other';
        return `
          <div class="track-card ${iconClass}" onclick="goToTrack('${track.id}')">
            <div class="track-card-icon">${track.icon}</div>
            <div class="track-card-body">
              <div class="track-card-name">${track.name}</div>
              <div class="track-card-desc">${track.chapters.length} chương · ${total} bài tập</div>
            </div>
            <div class="track-card-footer">
              <span class="track-card-stat">
                <strong>${done}</strong> hoàn thành
              </span>
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
  const iconClass = track.domain === 'cs' ? 'cs' : track.domain === 'lang' ? 'lang' : 'other';

  // Ensure chapters are initialized
  if (!openChapters[track.id]) openChapters[track.id] = new Set();

  const chapterSections = track.chapters.map((ch, ci) => {
    const isOpen = openChapters[track.id].has(ci);
    const hasProblems = ch.problems.length > 0;
    const chapterDone = ch.problems.filter((_, pi) => !!progress[`${track.id}|${ci}|${pi}`]).length;

    const rows = hasProblems ? ch.problems.map((p, pi) => {
      const key = `${track.id}|${ci}|${pi}`;
      const isDone = !!progress[key];
      return `
        <div class="problem-row${isDone ? ' done' : ''}" onclick="openProblem('${track.id}',${ci},${pi})">
          <button class="check-btn${isDone ? ' done' : ''}" onclick="event.stopPropagation();toggleDone('${track.id}',${ci},${pi})">
            ${isDone ? '✓' : ''}
          </button>
          <div class="problem-name"><span>${p.name}</span></div>
          <div class="difficulty ${p.difficulty}">${p.difficulty}</div>
          <div class="problem-view">Xem →</div>
        </div>`;
    }).join('') : `<div class="chapter-empty" onclick="openProblem('${track.id}',${ci},-1)">
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
          <div class="chapter-readme-row" onclick="event.stopPropagation();openProblem('${track.id}',${ci},-1)">
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

  // SVG ring values
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  main.innerHTML = `
    <div class="track-detail-hero ${iconClass}">
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
      <button class="readme-btn ${iconClass}" onclick="openProblem('${track.id}',0,-1)">
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
  // Auto-open first chapter with problems
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
// Modal / Content
// ─────────────────────────────────────────────────
function openProblem(trackId, chapterIdx, problemIdx) {
  const track = TRACKS.find(t => t.id === trackId);
  if (!track) return;

  const ch = track.chapters[chapterIdx];
  currentItem = { trackId, chapterIdx, problemIdx };

  const isReadme = problemIdx === -1;

  let title;
  let targetFile;

  if (isReadme) {
    // View chapter's README (or track overview for chapter 0 with no problems)
    title = '📖 ' + (ch ? ch.name : track.name);
    targetFile = ch ? `../${ch.path}/${ch.readme}` : `../${track.path}/${track.readme}`;
  } else {
    title = ch.problems[problemIdx].name;
    targetFile = `../${ch.path}/${ch.problems[problemIdx].file}`;
  }

  const domainClass = track.domain === 'cs' ? 'cs' : track.domain === 'lang' ? 'lang' : 'other';
  const domainLabel = track.domain === 'cs' ? 'CS' : track.domain === 'lang' ? 'NGÔN NGỮ' : 'KHÁC';

  document.getElementById('modalDomain').className = `modal-domain ${domainClass}`;
  document.getElementById('modalDomain').textContent = domainLabel;
  document.getElementById('modalTitle').textContent = title;

  // Prev / next: include README of every chapter first, then its problems
  const allItems = [];
  track.chapters.forEach((c, ci) => {
    allItems.push({ ci, pi: -1, title: '📖 ' + c.name });
    c.problems.forEach((p, pi) => {
      allItems.push({ ci, pi, title: p.name });
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

      // wrap tables
      body.querySelectorAll('table').forEach(tbl => {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        tbl.parentNode.insertBefore(wrap, tbl);
        wrap.appendChild(tbl);
      });

      // highlight code
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

  // Include README of every chapter first, then all problems
  const allItems = [];
  track.chapters.forEach((c, ci) => {
    allItems.push({ ci, pi: -1 });
    c.problems.forEach((_, pi) => allItems.push({ ci, pi }));
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

function renderAll() {
  renderSidebar();
  renderTopbar();
  renderTabs();
  renderList();
}

renderAll();
