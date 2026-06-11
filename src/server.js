require('dotenv').config();

const path = require('path');
const express = require('express');
const { engine } = require('express-handlebars');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
const { ensurePrivateChatSchema } = require('./config/ensureSchema');
const { verifyJwt } = require('./utils/jwt');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const onlineUsers = new Map();
const userSockets = new Map();

app.engine('hbs', engine({
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
    eq: (left, right) => left === right,
    initials: (name) => (name || '?').slice(0, 2).toUpperCase(),
    time: (date) => new Intl.DateTimeFormat('en', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

app.use(authRoutes);
app.use(chatRoutes);
app.use(uploadRoutes);

// Socket.IO uses the same JWT as the protected chat page.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    socket.user = verifyJwt(token);
    return next();
  } catch (error) {
    return next(new Error('Authentication failed.'));
  }
});

async function broadcastOnlineUsers() {
  io.emit('online-users', Array.from(onlineUsers.values()));
}

function addUserSocket(userId, socketId) {
  const sockets = userSockets.get(userId) || new Set();
  sockets.add(socketId);
  userSockets.set(userId, sockets);
}

function removeUserSocket(userId, socketId) {
  const sockets = userSockets.get(userId);

  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
    return true;
  }

  return false;
}

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  addUserSocket(socket.user.id, socket.id);

  onlineUsers.set(socket.user.id, {
    id: socket.user.id,
    username: socket.user.username
  });
  broadcastOnlineUsers();

  socket.on('load-private-messages', async (payload = {}) => {
    const peerId = Number(payload.peerId);

    if (!peerId || peerId === socket.user.id) {
      return;
    }

    try {
      const [messages] = await pool.execute(
        `SELECT messages.id, messages.user_id, messages.receiver_id, messages.body,
                messages.image_path, messages.created_at, users.username
           FROM messages
           JOIN users ON users.id = messages.user_id
          WHERE (messages.user_id = ? AND messages.receiver_id = ?)
             OR (messages.user_id = ? AND messages.receiver_id = ?)
          ORDER BY messages.created_at ASC
          LIMIT 100`,
        [socket.user.id, peerId, peerId, socket.user.id]
      );

      socket.emit('private-history', { peerId, messages });
    } catch (error) {
      console.error('Private history error:', error);
      socket.emit('message-error', 'Private messages could not be loaded. Run database/add-private-chat.sql if needed.');
    }
  });

  socket.on('send-message', async (payload = {}) => {
    const body = (payload.body || '').trim();
    const imagePath = payload.imagePath || null;
    const receiverId = Number(payload.receiverId);

    if (!body && !imagePath) {
      return;
    }

    if (!receiverId || receiverId === socket.user.id) {
      socket.emit('message-error', 'Choose a user before sending a private message.');
      return;
    }

    try {
      const [result] = await pool.execute(
        'INSERT INTO messages (user_id, receiver_id, body, image_path) VALUES (?, ?, ?, ?)',
        [socket.user.id, receiverId, body || null, imagePath]
      );

      const message = {
        id: result.insertId,
        user_id: socket.user.id,
        receiver_id: receiverId,
        username: socket.user.username,
        body,
        image_path: imagePath,
        created_at: new Date()
      };

      io.to(`user:${socket.user.id}`).to(`user:${receiverId}`).emit('new-message', message);
    } catch (error) {
      console.error('Private message error:', error);
      socket.emit('message-error', 'Message could not be sent. Run database/add-private-chat.sql if needed.');
    }
  });

  socket.on('disconnect', () => {
    const offline = removeUserSocket(socket.user.id, socket.id);

    if (offline) {
      onlineUsers.delete(socket.user.id);
      broadcastOnlineUsers();
    }
  });
});

const port = process.env.PORT || 3000;

ensurePrivateChatSchema()
  .then(() => {
    server.listen(port, () => {
      console.log(`Chat app running at http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Database schema check failed:', error);
    console.error('Make sure MySQL is running and database/schema.sql has been imported.');
    process.exit(1);
  });
