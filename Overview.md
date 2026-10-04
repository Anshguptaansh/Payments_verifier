# Live Payment Dashboard

A full-stack payment simulation that demonstrates how REST APIs, webhooks, HMAC signature verification, and WebSockets work together in a real-world payment flow.

---

## What This Project Does

A customer submits a payment from the frontend. The backend creates the payment record and hands it off to a simulated payment provider. After a short processing delay, the provider sends a signed webhook back to the backend. The backend verifies the signature, updates the payment status, and instantly pushes the result to an admin dashboard — no page refresh needed.

---

## How the Flow Works

```
Customer UI  →  REST API  →  Node.js Backend  →  Fake Payment Provider
                                    ↑                       |
                                    |   Signed webhook       |
                                    +───────────────────────+
                                    |
                              Verify + Persist
                                    |
                              WebSocket broadcast
                                    |
                               Admin Dashboard
```

1. Customer fills in a product name and amount, then clicks **Pay**
2. The frontend sends a POST request to the backend
3. The backend creates the payment and forwards it to the fake payment provider
4. The provider simulates processing and fires a signed webhook back
5. The backend verifies the HMAC-SHA256 signature to confirm the webhook is authentic
6. The payment record is updated in the database
7. The backend broadcasts the update over WebSocket
8. The admin dashboard reflects the new status in real time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, React Router, Vite |
| Backend | Node.js, Express.js |
| Real-time | WebSocket (`ws` library) |
| Database | SQLite (Node.js built-in `node:sqlite`) |
| Security | HMAC-SHA256 webhook signature verification |

---

## Key Concepts Demonstrated

- **REST** — request/response communication between the frontend and backend
- **Webhooks** — event-driven notifications from an external provider to the backend
- **HMAC verification** — ensures webhook payloads haven't been tampered with
- **WebSockets** — persistent connection that pushes live updates to the browser

---

## Features

- Customer payment page with product name, amount input, and live status feedback
- Simulated payment provider that produces successful or failed outcomes
- REST API for creating payments and fetching payment records
- Webhook endpoint that receives provider events — `payment.processing`, `payment.captured`, `payment.failed`
- HMAC-SHA256 signature verification to authenticate incoming webhooks
- SQLite-backed payment records that persist across server restarts
- WebSocket server that broadcasts payment events to all connected admin clients
- Admin dashboard with live payment ID, amount, status, event type, and timestamp — updates without a page refresh
- Health-check endpoint for monitoring backend availability

---

## Deployment

- **Frontend** — deployed on [Vercel](https://vercel.com)
- **Backend** — deployed on [Railway](https://railway.app)
