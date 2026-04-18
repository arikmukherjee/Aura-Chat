/* ══════════════════════════════════════════
   AURA CHAT — script.js
   ══════════════════════════════════════════ */

'use strict';

/* ── Data ── */
const CONTACTS = [
  {
    id: 'c1', name: 'Aria Chen', initials: 'AC', color: '#7c6aff',
    status: 'online', statusLabel: 'Active now',
    preview: 'Are you free this evening? 🎉',
    time: '2m',
    replies: [
      "Hey! What's up? 😊",
      "That sounds amazing! Let's definitely do that.",
      "I was just thinking about the same thing 😄",
      "Can't wait! This is going to be so fun.",
      "Sure, what time works for you?",
      "I'll bring the snacks 🍕",
      "Haha yes, totally agree with that!",
      "See you soon! 👋",
    ]
  },
  {
    id: 'c2', name: 'Luca Moretti', initials: 'LM', color: '#ff6aac',
    status: 'online', statusLabel: 'Active now',
    preview: 'Check out this link I found!',
    time: '14m',
    replies: [
      "Oh interesting, let me take a look 👀",
      "That's honestly really cool.",
      "Never thought about it that way before.",
      "Makes sense when you put it like that.",
      "I'll check it out later today.",
      "Bro this is wild 😂",
      "Thanks for sharing!",
    ]
  },
  {
    id: 'c3', name: 'Yuki Tanaka', initials: 'YT', color: '#3ddc84',
    status: 'away', statusLabel: 'Away',
    preview: 'Design files are ready ✨',
    time: '1h',
    replies: [
      "I'll review them now 🔍",
      "Looks great, nice work!",
      "Can we hop on a quick call?",
      "Approved! Let's move to the next step.",
      "The colors look way better in v3.",
      "Great job on this sprint 🎉",
    ]
  },
  {
    id: 'c4', name: 'Dev Team', initials: 'DT', color: '#ffbe00',
    status: 'online', statusLabel: '5 members',
    preview: 'Build passed ✅',
    time: '3h',
    replies: [
      "Great, merging now 🚀",
      "Anyone seen the latest PR?",
      "Tests are passing on main ✅",
      "We're ahead of schedule!",
      "Let's ship it 🎯",
      "Nice work everyone!",
    ]
  },
  {
    id: 'c5', name: 'Sophie Laurent', initials: 'SL', color: '#ff8c5a',
    status: 'offline', statusLabel: 'Last seen 2h ago',
    preview: 'Did you see the news? 😲',
    time: 'Yesterday',
    replies: [
      "Yes! I couldn't believe it either.",
      "Crazy times we live in...",
      "Talk more tomorrow?",
      "Night! 🌙",
    ]
  },
];

const EMOJIS = [
  '😊','😂','🥰','😎','🤔','😅','🥳','🤩',
  '👍','❤️','🔥','✨','🎉','💯','🙌','👏',
  '😭','😤','🤣','😇','🫶','💪','🎯','🚀',
  '🍕','☕','🎶','💡','🌟','⚡','🦋','🌈',
];

/* ── State ── */
let activeContactId = null;
let chatStore = {};        // { contactId: [{ id, text, sent, time, read }] }
let typingTimers = {};
let simulateTimer = null;

/* ── Init ── */
function init() {
  loadFromStorage();
  renderContactList(CONTACTS);
  setupEventListeners();
  buildEmojiPicker();
}

/* ── Storage ── */
function loadFromStorage() {
  try {
    const raw = localStorage.getItem('aura_chats');
    if (raw) chatStore = JSON.parse(raw);
  } catch (_) { chatStore = {}; }
}

function saveToStorage() {
  try { localStorage.setItem('aura_chats', JSON.stringify(chatStore)); }
  catch (_) {}
}

/* ── Contacts ── */
function renderContactList(contacts) {
  const list = document.getElementById('contactList');
  list.innerHTML = '';
  contacts.forEach(c => {
    const msgs = chatStore[c.id] || [];
    const lastMsg = msgs[msgs.length - 1];
    const preview = lastMsg ? lastMsg.text : c.preview;
    const time    = lastMsg ? lastMsg.time  : c.time;

    const li = document.createElement('li');
    li.className = 'contact-item' + (c.id === activeContactId ? ' active' : '');
    li.dataset.id = c.id;
    li.innerHTML = `
      <div class="avatar" style="background:${c.color}">
        ${c.initials}
        <span class="status-dot ${c.status}"></span>
      </div>
      <div class="contact-meta">
        <div class="contact-name">${c.name}</div>
        <div class="contact-preview">${escHtml(truncate(preview, 38))}</div>
      </div>
      <div class="contact-side">
        <div class="contact-time">${time}</div>
      </div>`;
    li.addEventListener('click', () => openChat(c.id));
    list.appendChild(li);
  });
}

/* ── Open chat ── */
function openChat(id) {
  activeContactId = id;
  const c = CONTACTS.find(x => x.id === id);
  if (!c) return;

  // Mobile: slide sidebar out
  if (window.innerWidth <= 700) {
    document.getElementById('sidebar').classList.add('slide-out');
    document.getElementById('sidebarOverlay').classList.remove('hidden');
  }

  // Show chat window
  document.getElementById('emptyState').classList.add('hidden');
  const win = document.getElementById('chatWindow');
  win.classList.remove('hidden');

  // Topbar
  document.getElementById('topbarName').textContent = c.name;
  const statusEl = document.getElementById('topbarStatus');
  statusEl.textContent = c.statusLabel;
  statusEl.className = 'topbar-status' + (c.status === 'offline' ? ' offline' : '');

  const avWrap = document.getElementById('topbarAvatar');
  avWrap.innerHTML = `<div class="avatar topbar-avatar" style="background:${c.color}">
    ${c.initials}<span class="status-dot ${c.status}"></span></div>`;

  // Mark active
  document.querySelectorAll('.contact-item').forEach(el =>
    el.classList.toggle('active', el.dataset.id === id));

  // Cancel existing simulate timer
  if (simulateTimer) clearTimeout(simulateTimer);

  // Render messages
  if (!chatStore[id]) chatStore[id] = [];
  renderMessages(id);
  scrollToBottom();
  document.getElementById('msgInput').focus();
}

/* ── Render messages ── */
function renderMessages(id) {
  const area = document.getElementById('messagesArea');
  area.innerHTML = `<div class="date-divider"><span>Today</span></div>`;
  const msgs = chatStore[id] || [];
  msgs.forEach(m => area.appendChild(buildMsgEl(m, id)));
  scrollToBottom();
}

function buildMsgEl(msg, contactId) {
  const c = CONTACTS.find(x => x.id === contactId);
  const row = document.createElement('div');
  row.className = `msg-row ${msg.sent ? 'sent' : 'recv'}`;
  row.dataset.msgId = msg.id;

  const ticks = msg.sent ? `<span class="read-ticks ${msg.read ? 'read' : ''}">✔✔</span>` : '';

  if (!msg.sent && c) {
    row.innerHTML = `
      <div class="msg-avatar" style="background:${c.color}">${c.initials}</div>
      <div class="msg-bubble-wrap">
        <div class="msg-bubble">${escHtml(msg.text)}</div>
        <div class="msg-meta"><span>${msg.time}</span></div>
      </div>`;
  } else {
    row.innerHTML = `
      <div class="msg-bubble-wrap">
        <div class="msg-bubble">${escHtml(msg.text)}</div>
        <div class="msg-meta">${ticks}<span>${msg.time}</span></div>
      </div>`;
  }
  return row;
}

/* ── Send message ── */
function sendMessage() {
  const input = document.getElementById('msgInput');
  const text  = input.value.trim();
  if (!text || !activeContactId) return;

  const msg = {
    id: Date.now(),
    text,
    sent: true,
    time: nowTime(),
    read: false,
  };
  chatStore[activeContactId] = chatStore[activeContactId] || [];
  chatStore[activeContactId].push(msg);
  saveToStorage();
  renderContactList(CONTACTS);

  // Append single message
  const area = document.getElementById('messagesArea');
  const el = buildMsgEl(msg, activeContactId);
  area.appendChild(el);
  scrollToBottom();

  input.value = '';
  input.style.height = 'auto';

  playSound();

  // Simulate reply after delay
  scheduleReply();

  // Mark read after short delay
  setTimeout(() => {
    msg.read = true;
    saveToStorage();
    const tick = area.querySelector(`[data-msg-id="${msg.id}"] .read-ticks`);
    if (tick) tick.classList.add('read');
  }, 1500);
}

/* ── Simulate incoming message ── */
function scheduleReply() {
  const id = activeContactId;
  const c  = CONTACTS.find(x => x.id === id);
  if (!c) return;

  const delay = 1800 + Math.random() * 2000;

  // Show typing
  setTimeout(() => showTyping(c.name), delay - 1200);

  simulateTimer = setTimeout(() => {
    hideTyping();
    const replies = c.replies;
    const text = replies[Math.floor(Math.random() * replies.length)];
    const msg = { id: Date.now(), text, sent: false, time: nowTime(), read: false };
    chatStore[id] = chatStore[id] || [];
    chatStore[id].push(msg);
    saveToStorage();
    renderContactList(CONTACTS);

    if (activeContactId === id) {
      const area = document.getElementById('messagesArea');
      const el = buildMsgEl(msg, id);
      area.appendChild(el);
      scrollToBottom();
    }
    playSound(true);
  }, delay);
}

/* ── Typing indicator ── */
function showTyping(name) {
  const ti = document.getElementById('typingIndicator');
  document.getElementById('typingLabel').textContent = `${name} is typing…`;
  ti.classList.remove('hidden');
  scrollToBottom();
}
function hideTyping() {
  document.getElementById('typingIndicator').classList.add('hidden');
}

/* ── Emoji picker ── */
function buildEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  EMOJIS.forEach(em => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn-item';
    btn.textContent = em;
    btn.addEventListener('click', () => {
      const input = document.getElementById('msgInput');
      const pos = input.selectionStart || input.value.length;
      input.value = input.value.slice(0, pos) + em + input.value.slice(pos);
      input.focus();
      picker.classList.add('hidden');
    });
    picker.appendChild(btn);
  });
}

/* ── Search contacts ── */
function handleSearch(query) {
  const q = query.toLowerCase();
  const filtered = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    (chatStore[c.id]?.slice(-1)[0]?.text || c.preview).toLowerCase().includes(q)
  );
  renderContactList(filtered);
}

/* ── Theme toggle ── */
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('aura_theme', html.dataset.theme);
}

/* ── Sound ── */
function playSound(incoming = false) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(incoming ? 520 : 660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(incoming ? 440 : 880, ctx.currentTime + .12);
    gain.gain.setValueAtTime(.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .22);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + .22);
  } catch (_) {}
}

/* ── Helpers ── */
function scrollToBottom() {
  requestAnimationFrame(() => {
    const area = document.getElementById('messagesArea');
    area.scrollTop = area.scrollHeight;
  });
}
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

/* ── Event listeners ── */
function setupEventListeners() {
  // Restore theme
  const savedTheme = localStorage.getItem('aura_theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  // Send button
  document.getElementById('sendBtn').addEventListener('click', sendMessage);

  // Enter key (Shift+Enter for newline)
  const input = document.getElementById('msgInput');
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    // Hide typing indicator on own input
    const picker = document.getElementById('emojiPicker');
    if (!picker.classList.contains('hidden')) picker.classList.add('hidden');
  });

  // Theme toggle
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // Search
  document.getElementById('searchInput').addEventListener('input', e => {
    handleSearch(e.target.value);
  });

  // Emoji toggle
  document.getElementById('emojiBtn').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('emojiPicker').classList.toggle('hidden');
  });

  // Close emoji on outside click
  document.addEventListener('click', () => {
    document.getElementById('emojiPicker').classList.add('hidden');
  });
  document.getElementById('emojiPicker').addEventListener('click', e => e.stopPropagation());

  // Back button (mobile)
  document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('slide-out');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  });

  // Overlay click (mobile)
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('slide-out');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  });
}

/* ── Bootstrap ── */
document.addEventListener('DOMContentLoaded', init);
