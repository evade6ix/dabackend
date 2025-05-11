const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let conversations = {};

io.on('connection', (socket) => {
  console.log('🟢 Connected:', socket.id);

  socket.on('join', ({ chatId }) => {
    socket.join(chatId);
    console.log(\`🔁 \${socket.id} joined \${chatId}\`);
  });

  socket.on('message', ({ chatId, sender, text }) => {
    const msg = { sender, text, timestamp: new Date() };
    if (!conversations[chatId]) conversations[chatId] = [];
    conversations[chatId].push(msg);
    io.to(chatId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Disconnected:', socket.id);
  });
});

app.get('/api/messages/:chatId', (req, res) => {
  const { chatId } = req.params;
  res.json(conversations[chatId] || []);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(\`🚀 Live chat backend running on http://localhost:\${PORT}\`);
});
