// Socket.io backend setup for real-time updates
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import corsMiddleware from './cors-config.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

app.use(express.json());
app.use(corsMiddleware);
// ...existing code...

// Export io for use in routes
export { io, app, server };
