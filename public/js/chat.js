const app = document.querySelector('.chat-app');
const messagesEl = document.getElementById('messages');
const onlineUsersEl = document.getElementById('onlineUsers');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const clearImage = document.getElementById('clearImage');
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const toggleUsers = document.getElementById('toggleUsers');
const usersPanel = document.querySelector('.users-panel');
const chatTitle = document.getElementById('chatTitle');
const chatSubtitle = document.getElementById('chatSubtitle');

const currentUserId = Number(app.dataset.userId);
const token = app.dataset.token;
const socket = io({ auth: { token } });

let selectedImage = null;
let activePeer = null;
let onlineUsers = [];
const unreadCounts = new Map();

const emojis = [
  '\u{1F600}', '\u{1F603}', '\u{1F604}', '\u{1F601}', '\u{1F606}', '\u{1F605}', '\u{1F602}', '\u{1F923}',
  '\u{1F60A}', '\u{1F60D}', '\u{1F618}', '\u{1F60E}', '\u{1F642}', '\u{1F914}', '\u{1F62E}', '\u{1F622}',
  '\u{1F621}', '\u{1F44D}', '\u{1F44E}', '\u{1F44F}', '\u{1F64C}', '\u{1F64F}', '\u{1F4AA}', '\u{1F525}',
  '\u{2764}\u{FE0F}', '\u{1F499}', '\u{1F49A}', '\u{1F49B}', '\u{2B50}', '\u{2728}', '\u{1F389}', '\u{2705}',
  '\u{2615}', '\u{1F355}', '\u{26BD}', '\u{1F3AE}', '\u{1F4F7}', '\u{1F4BB}', '\u{1F680}', '\u{1F319}'
];

function scrollToLatestMessage() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value || '';
  return element.innerHTML;
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getInitials(username) {
  return (username || '?').slice(0, 2).toUpperCase();
}

function clearMessages() {
  messagesEl.innerHTML = '';
}

function renderEmptyChat(message) {
  messagesEl.innerHTML = `
    <div class="empty-chat">
      <i class="bi bi-person-lines-fill"></i>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function isMessageForActiveChat(message) {
  if (!activePeer) {
    return false;
  }

  const senderId = Number(message.user_id);
  const receiverId = Number(message.receiver_id);

  return (senderId === currentUserId && receiverId === activePeer.id)
    || (senderId === activePeer.id && receiverId === currentUserId);
}

function getPeerIdFromMessage(message) {
  const senderId = Number(message.user_id);
  const receiverId = Number(message.receiver_id);

  return senderId === currentUserId ? receiverId : senderId;
}

function updatePageTitle() {
  const totalUnread = Array.from(unreadCounts.values())
    .reduce((total, count) => total + count, 0);

  document.title = totalUnread > 0
    ? `(${totalUnread}) Chat | Simple Chat`
    : 'Chat | Simple Chat';
}

function refreshUserList() {
  renderOnlineUsers(onlineUsers);
  updatePageTitle();
}

function selectPeer(user) {
  activePeer = {
    id: Number(user.id),
    username: user.username
  };

  unreadCounts.set(activePeer.id, 0);

  chatTitle.textContent = activePeer.username;
  chatSubtitle.textContent = 'Private chat';
  messageInput.disabled = false;
  sendButton.disabled = false;
  messageInput.placeholder = `Message ${activePeer.username}`;
  clearMessages();
  socket.emit('load-private-messages', { peerId: activePeer.id });
  messageInput.focus();
  usersPanel.classList.remove('open');
  document.querySelector('.users-overlay')?.classList.remove('open');
  refreshUserList();
}

function insertEmoji(emoji) {
  const start = messageInput.selectionStart || 0;
  const end = messageInput.selectionEnd || 0;
  const before = messageInput.value.slice(0, start);
  const after = messageInput.value.slice(end);

  messageInput.value = `${before}${emoji}${after}`;
  messageInput.focus();
  messageInput.selectionStart = start + emoji.length;
  messageInput.selectionEnd = start + emoji.length;
}

function renderEmojiPicker() {
  emojiPicker.innerHTML = emojis.map((emoji) => `
    <button class="emoji-option" type="button" data-emoji="${emoji}" aria-label="Insert ${emoji}">
      ${emoji}
    </button>
  `).join('');
}

function renderMessage(message) {
  const article = document.createElement('article');
  article.className = `message ${Number(message.user_id) === currentUserId ? 'mine' : ''}`;

  const body = message.body ? `<p>${escapeHtml(message.body)}</p>` : '';
  const image = message.image_path
    ? `<img src="${escapeHtml(message.image_path)}" alt="Shared image" class="message-image">`
    : '';

  article.innerHTML = `
    <div class="message-bubble">
      <div class="message-meta">
        <strong>${escapeHtml(message.username)}</strong>
        <span>${formatTime(message.created_at)}</span>
      </div>
      ${body}
      ${image}
    </div>
  `;

  messagesEl.appendChild(article);
  scrollToLatestMessage();
}

function renderOnlineUsers(users) {
  onlineUsers = users;
  const peers = users.filter((user) => Number(user.id) !== currentUserId);

  if (peers.length === 0) {
    onlineUsersEl.innerHTML = '<p class="empty-users">No other users online.</p>';
    return;
  }

  onlineUsersEl.innerHTML = peers.map((user) => {
    const userId = Number(user.id);
    const unread = unreadCounts.get(userId) || 0;

    return `
    <button class="user-item ${activePeer?.id === Number(user.id) ? 'active' : ''}" type="button" data-user-id="${user.id}" data-username="${escapeHtml(user.username)}">
      <div class="avatar">${escapeHtml(getInitials(user.username))}</div>
      <div class="text-truncate">
        <div class="fw-semibold text-truncate">${escapeHtml(user.username)}</div>
        <small class="text-secondary">${unread > 0 ? `${unread} new message${unread === 1 ? '' : 's'}` : 'Online'}</small>
      </div>
      ${unread > 0 ? `<span class="unread-badge">${unread > 99 ? '99+' : unread}</span>` : '<span class="status-dot"></span>'}
    </button>
  `;
  }).join('');
}

function resetImage() {
  selectedImage = null;
  imageInput.value = '';
  previewImage.src = '';
  imagePreview.classList.add('d-none');
}

async function uploadSelectedImage() {
  if (!selectedImage) {
    return null;
  }

  const formData = new FormData();
  formData.append('image', selectedImage);

  const response = await fetch('/upload', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Upload failed.');
  }

  const data = await response.json();
  return data.imagePath;
}

imageInput.addEventListener('change', () => {
  selectedImage = imageInput.files[0] || null;

  if (!selectedImage) {
    resetImage();
    return;
  }

  previewImage.src = URL.createObjectURL(selectedImage);
  imagePreview.classList.remove('d-none');
});

clearImage.addEventListener('click', resetImage);

renderEmojiPicker();

emojiButton.addEventListener('click', () => {
  emojiPicker.classList.toggle('d-none');
});

emojiPicker.addEventListener('click', (event) => {
  const button = event.target.closest('.emoji-option');

  if (!button) {
    return;
  }

  insertEmoji(button.dataset.emoji);
});

onlineUsersEl.addEventListener('click', (event) => {
  const userButton = event.target.closest('.user-item');

  if (!userButton) {
    return;
  }

  selectPeer({
    id: userButton.dataset.userId,
    username: userButton.dataset.username
  });
});

document.addEventListener('click', (event) => {
  const insideEmojiControls = emojiPicker.contains(event.target) || emojiButton.contains(event.target);

  if (!insideEmojiControls) {
    emojiPicker.classList.add('d-none');
  }
});

messageForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const body = messageInput.value.trim();

  if (!activePeer || (!body && !selectedImage)) {
    return;
  }

  try {
    const imagePath = await uploadSelectedImage();
    socket.emit('send-message', {
      body,
      imagePath,
      receiverId: activePeer.id
    });
    messageInput.value = '';
    resetImage();
  } catch (error) {
    alert('Your image or message could not be sent.');
  }
});

toggleUsers?.addEventListener('click', () => {
  usersPanel.classList.toggle('open');
});

socket.on('new-message', (message) => {
  if (isMessageForActiveChat(message)) {
    renderMessage(message);
    return;
  }

  const peerId = getPeerIdFromMessage(message);
  const messageIsForMe = Number(message.receiver_id) === currentUserId;

  if (messageIsForMe) {
    unreadCounts.set(peerId, (unreadCounts.get(peerId) || 0) + 1);
    refreshUserList();
  }
});

socket.on('private-history', ({ peerId, messages }) => {
  if (!activePeer || Number(peerId) !== activePeer.id) {
    return;
  }

  clearMessages();

  if (messages.length === 0) {
    renderEmptyChat(`No messages with ${activePeer.username} yet.`);
    return;
  }

  messages.forEach(renderMessage);
});

socket.on('online-users', renderOnlineUsers);
socket.on('message-error', (message) => alert(message));

scrollToLatestMessage();
