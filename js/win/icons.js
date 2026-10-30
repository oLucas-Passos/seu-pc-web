// Ícones do Windows simulado (desenhos próprios, no estilo flat).

const I = {
  start: '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="9.5" height="9.5" rx="1.2" fill="#0a7ce2"/><rect x="12.5" y="2" width="9.5" height="9.5" rx="1.2" fill="#2b96f0"/><rect x="2" y="12.5" width="9.5" height="9.5" rx="1.2" fill="#2b96f0"/><rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1.2" fill="#4cb0ff"/></svg>',
  folder: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><path d="M4 16h40v3H4z" fill="#fbd769"/></svg>',
  folderDocs: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><rect x="17" y="21" width="14" height="15" rx="1.5" fill="#fff"/><path d="M20 25h8M20 28h8M20 31h5" stroke="#3a7bd5" stroke-width="1.6"/></svg>',
  folderDown: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><path d="M24 21v10M19.5 27l4.5 4.5 4.5-4.5" stroke="#1e7d3c" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 35h12" stroke="#1e7d3c" stroke-width="2.6" stroke-linecap="round"/></svg>',
  folderPics: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><rect x="15" y="21" width="18" height="14" rx="2" fill="#4aa3df"/><path d="M15 32l5-5 4 4 3-3 6 6v1H15z" fill="#2f7d3a"/><circle cx="28" cy="25" r="2" fill="#ffe27a"/></svg>',
  folderMusic: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><path d="M22 34a3 3 0 1 1-2-2.8V22l9-2v10" fill="none" stroke="#8a3ac9" stroke-width="2.2"/><circle cx="26.5" cy="31.5" r="2.6" fill="#8a3ac9"/><circle cx="19" cy="34" r="2.6" fill="#8a3ac9"/></svg>',
  folderVideo: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><rect x="15" y="22" width="18" height="12" rx="2" fill="#5b3fa8"/><path d="M22 25v6l5-3z" fill="#fff"/></svg>',
  folderDesktop: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><rect x="15" y="21" width="18" height="12" rx="1.5" fill="#1f6fd1"/><path d="M21 36h6M24 33v3" stroke="#555" stroke-width="2"/></svg>',
  file: '<svg viewBox="0 0 48 48"><path d="M11 4h18l10 10v28a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#c8ccd2"/><path d="M29 4v10h10" fill="#e6e9ee" stroke="#c8ccd2"/></svg>',
  txt: '<svg viewBox="0 0 48 48"><path d="M11 4h18l10 10v28a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#c8ccd2"/><path d="M29 4v10h10" fill="#e6e9ee" stroke="#c8ccd2"/><path d="M15 20h18M15 25h18M15 30h18M15 35h11" stroke="#5c8fd6" stroke-width="1.8"/></svg>',
  image: '<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="3" fill="#3d9be0"/><path d="M5 33l11-11 8 8 6-6 13 13v0a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill="#2f8f46"/><circle cx="33" cy="17" r="3.5" fill="#ffe27a"/></svg>',
  pdf: '<svg viewBox="0 0 48 48"><path d="M11 4h18l10 10v28a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#c8ccd2"/><path d="M29 4v10h10" fill="#e6e9ee" stroke="#c8ccd2"/><rect x="9" y="24" width="24" height="11" rx="2" fill="#d93025"/><text x="21" y="32.5" font-size="8" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">PDF</text></svg>',
  music: '<svg viewBox="0 0 48 48"><rect x="6" y="6" width="36" height="36" rx="8" fill="#8a3ac9"/><path d="M21 32a4 4 0 1 1-2.5-3.7V16l12-3v14" fill="none" stroke="#fff" stroke-width="2.6"/><circle cx="26.5" cy="27.5" r="3.6" fill="#fff"/><circle cx="17" cy="31.5" r="3.6" fill="#fff"/></svg>',
  video: '<svg viewBox="0 0 48 48"><rect x="5" y="10" width="38" height="28" rx="4" fill="#5b3fa8"/><path d="M20 17v14l12-7z" fill="#fff"/></svg>',
  pc: '<svg viewBox="0 0 48 48"><rect x="4" y="7" width="40" height="27" rx="3" fill="#3a3f47"/><rect x="7" y="10" width="34" height="21" rx="1" fill="#2b8ae2"/><path d="M7 26l10-8 8 6 6-4 10 7v4H7z" fill="#5cb2ff" opacity=".6"/><path d="M18 41h12l-2-7h-8z" fill="#7a808a"/><rect x="14" y="40" width="20" height="3" rx="1.5" fill="#5a6069"/></svg>',
  trash: '<svg viewBox="0 0 48 48"><path d="M12 14h24l-2.5 27a3 3 0 0 1-3 2.7H17.5a3 3 0 0 1-3-2.7z" fill="#cfd8e3" stroke="#8a97a8"/><rect x="9" y="9" width="30" height="5" rx="2" fill="#aab6c5"/><path d="M19 19v19M24 19v19M29 19v19" stroke="#8a97a8" stroke-width="1.6"/></svg>',
  trashFull: '<svg viewBox="0 0 48 48"><path d="M12 14h24l-2.5 27a3 3 0 0 1-3 2.7H17.5a3 3 0 0 1-3-2.7z" fill="#cfd8e3" stroke="#8a97a8"/><path d="M14 13l6-6 5 4 6-3 3 5z" fill="#f2f2f2" stroke="#8a97a8"/><rect x="9" y="11" width="30" height="5" rx="2" fill="#aab6c5"/><path d="M19 21v17M24 21v17M29 21v17" stroke="#8a97a8" stroke-width="1.6"/></svg>',
  explorer: '<svg viewBox="0 0 48 48"><path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#e0a526"/><path d="M4 16h40v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f8c94a"/><rect x="4" y="16" width="40" height="5" fill="#2f7fd8"/></svg>',
  notepad: '<svg viewBox="0 0 48 48"><rect x="9" y="6" width="30" height="37" rx="3" fill="#fff" stroke="#9db6d9"/><rect x="9" y="6" width="30" height="8" rx="3" fill="#3c8de0"/><path d="M15 21h18M15 26h18M15 31h18M15 36h12" stroke="#9aa6b5" stroke-width="1.8"/><path d="M15 4v6M22 4v6M29 4v6" stroke="#2b5d99" stroke-width="2" stroke-linecap="round"/></svg>',
  calculator: '<svg viewBox="0 0 48 48"><rect x="9" y="4" width="30" height="40" rx="4" fill="#3b4048"/><rect x="13" y="8" width="22" height="9" rx="1.5" fill="#cfe6d6"/><g fill="#7c848f"><rect x="13" y="21" width="5" height="4" rx="1"/><rect x="21.5" y="21" width="5" height="4" rx="1"/><rect x="13" y="28" width="5" height="4" rx="1"/><rect x="21.5" y="28" width="5" height="4" rx="1"/><rect x="13" y="35" width="5" height="4" rx="1"/><rect x="21.5" y="35" width="5" height="4" rx="1"/></g><rect x="30" y="21" width="5" height="18" rx="1" fill="#f28b2b"/></svg>',
  paint: '<svg viewBox="0 0 48 48"><path d="M24 5C13 5 5 13 5 23c0 8 6 12 11 11 3-.6 3-4 6-4 4 0 3 6 8 6 8 0 13-6 13-13C43 13 35 5 24 5z" fill="#f4e3c3" stroke="#b9a37a"/><circle cx="15" cy="20" r="3.4" fill="#e53935"/><circle cx="22" cy="13" r="3.4" fill="#fbc02d"/><circle cx="31" cy="14" r="3.4" fill="#43a047"/><circle cx="36" cy="22" r="3.4" fill="#1e88e5"/></svg>',
  photos: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="6" fill="url(#pg)"/><defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36b0ff"/><stop offset="1" stop-color="#0d5fbf"/></linearGradient></defs><path d="M5 34l11-11 8 8 5-5 14 14v-1a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6z" fill="#fff" opacity=".9"/><circle cx="33" cy="17" r="3.5" fill="#fff"/></svg>',
  browser: '<svg viewBox="0 0 48 48"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#36d3a8"/><stop offset=".55" stop-color="#1f8be0"/><stop offset="1" stop-color="#1557c0"/></linearGradient></defs><circle cx="24" cy="24" r="19" fill="url(#bg1)"/><path d="M8 26c3-9 13-14 22-11 6 2 9 7 8 12-1-4-6-7-12-6-7 1-9 7-6 11 2 3 6 4 9 3-9 6-21 2-21-9z" fill="#fff" opacity=".85"/></svg>',
  settings: '<svg viewBox="0 0 48 48"><path d="M24 4l4 5 6-1 1 6 5 3-2 6 2 6-5 3-1 6-6-1-4 5-4-5-6 1-1-6-5-3 2-6-2-6 5-3 1-6 6 1z" fill="#6b7a8f"/><circle cx="24" cy="24" r="7" fill="#e8edf3"/><circle cx="24" cy="24" r="3" fill="#6b7a8f"/></svg>',
  taskmgr: '<svg viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="4" fill="#1f2a37"/><path d="M9 31l7-7 6 5 8-12 5 6 4-3" fill="none" stroke="#39d98a" stroke-width="2.6" stroke-linejoin="round"/></svg>',
  store: '<svg viewBox="0 0 48 48"><path d="M9 15h30l-2 26a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3z" fill="#3b6fd4"/><path d="M17 15v-3a7 7 0 0 1 14 0v3" fill="none" stroke="#3b6fd4" stroke-width="3"/><rect x="17" y="22" width="6" height="6" fill="#f25022"/><rect x="25" y="22" width="6" height="6" fill="#7fba00"/><rect x="17" y="30" width="6" height="6" fill="#00a4ef"/><rect x="25" y="30" width="6" height="6" fill="#ffb900"/></svg>',
  player: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="10" fill="#ff6a3d"/><path d="M19 15v18l15-9z" fill="#fff"/></svg>',
  minesweeper: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="6" fill="#9fb3c8"/><circle cx="24" cy="25" r="9" fill="#1b1b1b"/><path d="M24 10v6M24 34v6M9 25h6M33 25h6M13.5 14.5l4 4M30.5 31.5l4 4M34.5 14.5l-4 4M17.5 31.5l-4 4" stroke="#1b1b1b" stroke-width="2.6" stroke-linecap="round"/><circle cx="21" cy="22" r="2.4" fill="#fff"/></svg>',
  tictactoe: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="8" fill="#2e7d6b"/><path d="M19 11v26M29 11v26M11 19h26M11 29h26" stroke="#e8f5f1" stroke-width="2.4"/><path d="M12.5 12.5l4 4M16.5 12.5l-4 4" stroke="#ffd54f" stroke-width="2.4" stroke-linecap="round"/><circle cx="34" cy="34" r="2.6" fill="none" stroke="#fff" stroke-width="2.2"/></svg>',
  snake: '<svg viewBox="0 0 48 48"><rect x="5" y="5" width="38" height="38" rx="8" fill="#14301f"/><path d="M12 34h10V24h12V14" fill="none" stroke="#5be37d" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="14" r="3.4" fill="#5be37d"/><circle cx="14" cy="14" r="2.6" fill="#ff5252"/></svg>',
  user: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#cfd8e3"/><circle cx="24" cy="19" r="8" fill="#7b8a9e"/><path d="M9 39c3-8 9-11 15-11s12 3 15 11a20 20 0 0 1-30 0z" fill="#7b8a9e"/></svg>',
  shortcut: '<svg viewBox="0 0 48 48"><rect x="4" y="30" width="14" height="14" rx="2" fill="#fff" stroke="#999"/><path d="M8 40l6-6M10 34h4v4" stroke="#1a73e8" stroke-width="2" fill="none"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  warn: '<svg viewBox="0 0 24 24"><path d="M12 3l10 18H2z" fill="#f5b400"/><path d="M12 9v6M12 17.5v.5" stroke="#1b1b1b" stroke-width="2.2" stroke-linecap="round"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a73e8"/><path d="M12 11v6M12 7.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  error: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#d93025"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  question: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#1a73e8"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.4 2.5c-.6.3-.9.8-.9 1.5V14M12 17.3v.4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
};

// Ícones de linha da interface (usam currentColor).
const L = {
  search: '<path d="M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 0 1 0-15zM21 21l-5.2-5.2"/>',
  wifi: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.5a5 5 0 0 1 6.8 0"/><circle cx="12" cy="19" r="1.2" fill="currentColor"/>',
  wifiOff: '<path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.3a9.5 9.5 0 0 1 13 0M8.6 15.5a5 5 0 0 1 6.8 0" opacity=".35"/><path d="M3 3l18 18"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6"/>',
  battery: '<rect x="2.5" y="7" width="17" height="10" rx="2"/><path d="M21.5 10.5v3"/><rect x="5" y="9.5" width="10" height="5" fill="currentColor" stroke="none"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
  power: '<path d="M12 3v8"/><path d="M6.3 7.2a8 8 0 1 0 11.4 0"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  fwd: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  min: '<path d="M5 12h14"/>',
  max: '<rect x="5" y="5" width="14" height="14" rx="1.5"/>',
  restore: '<rect x="5" y="8" width="11" height="11" rx="1.5"/><path d="M8 8V5.5A.5.5 0 0 1 8.5 5H18a1 1 0 0 1 1 1v9.5a.5.5 0 0 1-.5.5H16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  home: '<path d="M4 11l8-7 8 7v9H4z"/><path d="M10 20v-6h4v6"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  cut: '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16L19 4M16 16L5 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  paste: '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5V3h6v2M9 11h6M9 15h4"/>',
  rename: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  sort: '<path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4"/>',
  view: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevD: '<path d="M5 9l7 7 7-7"/>',
  chevU: '<path d="M5 15l7-7 7 7"/>',
  bluetooth: '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>',
  plane: '<path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7 4v2l-7-2v5l2 1.5V21l-3.5-1L8.5 21v-1.5l2-1.5v-5l-7 2v-2l7-4z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M5 8l7 1.5L19 8M12 9.5V14l-3 7M12 14l3 7"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  apps: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
  update: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/><path d="M12 8v4l3 2"/>',
  display: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  storage: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 12h5"/><circle cx="17" cy="12" r="1" fill="currentColor"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  brush: '<path d="M14 4l6 6-8 8-6-6z"/><path d="M6 12c-2 0-3 2-3 4 0 2-1 3-2 3 4 2 8 1 8-3"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/>',
  eraser: '<path d="M16 4l5 5-10 10H6l-3-3z"/><path d="M11 19h10"/>',
  bucket: '<path d="M5 11l7-7 7 7-7 7z"/><path d="M19 15c1 1.5 2 3 2 4a2 2 0 0 1-4 0c0-1 1-2.5 2-4z"/>',
  line: '<path d="M5 19L19 5"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="9" ry="6.5"/>',
  undo: '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 0 12h-2"/>',
  redo: '<path d="M15 7l5 5-5 5"/><path d="M20 12H10a6 6 0 0 0 0 12h2"/>',
  zoomIn: '<circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.5-5.5M10.5 7.5v6M7.5 10.5h6"/>',
  zoomOut: '<circle cx="10.5" cy="10.5" r="7"/><path d="M21 21l-5.5-5.5M7.5 10.5h6"/>',
  rotate: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  pause: '<path d="M7 4h4v16H7zM13 4h4v16h-4z" fill="currentColor"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  text: '<path d="M5 6h14M12 6v13"/>',
  sleep: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  restart: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  device: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M11 18h2"/>',
  headphones: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  cart: '<path d="M3 4h2l2.5 11h11L21 7H7"/><circle cx="9" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

export function icon(name, size = 32) {
  const svg = I[name] || I.file;
  return `<span class="wi" style="width:${size}px;height:${size}px">${svg}</span>`;
}

export function lico(name, size = 18) {
  return `<svg class="li" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${L[name] || ''}</svg>`;
}

export function iconEl(name, size = 32) {
  const t = document.createElement('template');
  t.innerHTML = icon(name, size);
  return t.content.firstChild;
}

export function licoEl(name, size = 18) {
  const t = document.createElement('template');
  t.innerHTML = lico(name, size);
  return t.content.firstChild;
}

export function hasIcon(name) { return !!I[name]; }
