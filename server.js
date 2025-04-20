// Обработка тестовых уведомлений между пользователями
socket.on('test-notification', (data) => {
  console.log('Test notification received on server:', data);
  
  // Пересылаем уведомление всем участникам комнаты
  io.to(FAMILY_ROOM).emit('test-notification', data);
});// Импортируем middleware
const corsMiddleware = require('./middleware/cors');

// Используем наш middleware
app.use(corsMiddleware);

// Добавим тестовый endpoint
app.get('/api/status', (req, res) => {
res.json({ status: 'Socket.io server is running' });
});const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Расширенные настройки CORS
app.use(cors({
origin: '*', // Разрешаем запросы с любого источника для разработки
methods: ["GET", "POST", "OPTIONS"],
credentials: true
}));

const server = http.createServer(app);

const io = new Server(server, {
cors: {
  origin: "*", // Разрешаем подключения с любого источника
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["my-custom-header"],
  exposedHeaders: ["my-custom-header"]
},
transports: ['websocket', 'polling'] // Поддержка разных транспортов
});

// Комната для Вовы и Тани
const FAMILY_ROOM = 'family-room';

io.on('connection', (socket) => {
console.log('User connected:', socket.id);

// Присоединение к комнате
socket.on('join-room', (data) => {
  socket.join(FAMILY_ROOM);
  socket.userRole = data.role;
  console.log(`${data.role} joined the room`);
  
  // Уведомить других членов комнаты
  socket.to(FAMILY_ROOM).emit('user-connected', {
    role: data.role,
    socketId: socket.id
  });
});

// Обработка обновления геолокации
socket.on('location-update', (locationData) => {
  console.log(`${socket.userRole} location update:`, locationData);
  socket.to(FAMILY_ROOM).emit('partner-location', {
    role: socket.userRole,
    location: locationData
  });
});

// Обработка отключения
socket.on('disconnect', () => {
  console.log('User disconnected:', socket.id);
  socket.to(FAMILY_ROOM).emit('user-disconnected', {
    socketId: socket.id,
    role: socket.userRole
  });
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`Socket.io server running on port ${PORT}`);
});