// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
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