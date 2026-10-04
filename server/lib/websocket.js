// ============================================================
// websocket.js — WebSocket Server & Broadcasting
// ============================================================
// WebSockets provide a PERSISTENT, TWO-WAY connection between
// the server and the browser. Unlike HTTP (which is request/response),
// a WebSocket connection stays open and the server can PUSH data
// to the client at any time without the client asking.
//
// HTTP vs WebSocket:
//   HTTP:      Client asks → Server responds → Connection closes
//   WebSocket: Connection opens → Both sides can send anytime → Stays open
//
// WHY WE NEED THIS:
//   When a webhook arrives and updates a payment, we want the Admin
//   Dashboard to update INSTANTLY. Without WebSockets, the dashboard
//   would have to poll (keep asking "any updates?") every few seconds.
//   With WebSockets, the server pushes the update the moment it happens.
//
// WHERE IT FITS:
//   Webhook received → Payment updated → broadcast() → All connected dashboards
//
// HOW IT WORKS:
//   1. WebSocket server attaches to the same HTTP server as Express
//   2. Admin dashboard connects via wss://<your-render-url> in production
//      or ws://localhost:3001 in local development
//   3. When broadcast() is called, it loops through ALL connected
//      clients and sends them the data
//   4. A ping/pong heartbeat keeps connections alive — cloud providers
//      (Render, Railway, etc.) drop idle WebSocket connections after ~60s
// ============================================================

import { WebSocketServer } from 'ws';

let wss = null;

// Allowed origins for WebSocket connections.
// Reads from ALLOWED_ORIGIN env var (same as CORS) with localhost fallback.
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

/**
 * Initialize the WebSocket server.
 * Called once from index.js, attached to the same HTTP server.
 *
 * @param {http.Server} server - The HTTP server instance
 */
export function initWebSocket(server) {
  wss = new WebSocketServer({
    server,
    // Validate the origin of incoming WebSocket upgrade requests.
    // This prevents any random website from connecting and receiving live payment data.
    verifyClient: ({ origin }) => {
      // Allow connections with no origin header (e.g. server-to-server, curl, Postman)
      if (!origin) return true;
      const allowed = origin === allowedOrigin;
      if (!allowed) {
        console.warn(`[WebSocket] Rejected connection from disallowed origin: ${origin}`);
      }
      return allowed;
    }
  });

  // ---- Ping/Pong Heartbeat ----
  // Cloud platforms drop idle WebSocket connections after ~30-60 seconds.
  // We ping every 25 seconds so the connection stays alive.
  // If a client doesn't respond to a ping, it's terminated and cleaned up.
  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log('[WebSocket] Terminating unresponsive client.');
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 25000);

  wss.on('close', () => clearInterval(heartbeat));

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; }); // Client responded to ping

    console.log(`[WebSocket] New client connected. Total clients: ${wss.clients.size}`);

    // Send a welcome message to the newly connected client
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      message: 'Connected to Live Payment Dashboard WebSocket',
      timestamp: new Date().toISOString()
    }));

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected. Total clients: ${wss.clients.size}`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Client error:', error.message);
    });
  });

  console.log('[WebSocket] Server initialized and ready for connections.');
}

/**
 * Broadcast a message to ALL connected WebSocket clients.
 * This is called from the webhook endpoint after a payment is updated.
 *
 * @param {object} data - The data to broadcast (will be JSON.stringified)
 */
export function broadcast(data) {
  if (!wss) {
    console.warn('[WebSocket] Server not initialized. Cannot broadcast.');
    return;
  }

  const message = JSON.stringify(data);
  let sentCount = 0;

  // Loop through every connected client and send the message
  wss.clients.forEach((client) => {
    // readyState 1 === WebSocket.OPEN
    if (client.readyState === 1) {
      client.send(message);
      sentCount++;
    }
  });

  console.log(`[WebSocket] Broadcast sent to ${sentCount} client(s).`);
}
