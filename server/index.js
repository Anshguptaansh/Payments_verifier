// ============================================================
// index.js — Main Server Entry Point
// ============================================================
// This is where everything comes together:
//   1. Express app handles HTTP requests (REST API + Webhooks)
//   2. WebSocket server handles persistent connections (Admin Dashboard)
//   3. Both share the same HTTP server
//
// ARCHITECTURE:
//   ┌──────────────── HTTP Server ────────────────┐
//   │                                             │
//   │   Express (REST + Webhooks)                 │
//   │     GET  /health                            │
//   │     POST /api/payments                      │
//   │     GET  /api/payments                      │
//   │     GET  /api/payments/:id                  │
//   │     POST /webhooks/payment                  │
//   │                                             │
//   │   WebSocket Server (ws://)                  │
//   │     Connected admin dashboards              │
//   │                                             │
//   └─────────────────────────────────────────────┘
// ============================================================

import http from 'http';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import paymentRoutes from './routes/payments.js';
import webhookRoutes from './routes/webhooks.js';
import { initWebSocket } from './lib/websocket.js';

const app = express();

// Middleware
app.use(cors({
  // Allow requests only from the frontend URL set in ALLOWED_ORIGIN env var.
  // Falls back to localhost for local development.
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Backend server is running correctly!'
  });
});

// Mount routes
app.use('/api/payments', paymentRoutes);   // REST API (Customer → Backend)
app.use('/webhooks', webhookRoutes);        // Webhook (Fake Provider → Backend)

// Create HTTP server (needed to attach WebSocket to the same server)
const server = http.createServer(app);

// Initialize WebSocket server on the same HTTP server
initWebSocket(server);

// Start listening
server.listen(config.port, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  Live Payment Dashboard — Backend Server');
  console.log('═══════════════════════════════════════════════');
  console.log(`  HTTP Server:  http://localhost:${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/health`);
  console.log(`  REST API:     http://localhost:${config.port}/api/payments`);
  console.log(`  Webhook:      http://localhost:${config.port}/webhooks/payment`);
  console.log(`  WebSocket:    ws://localhost:${config.port}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
});
