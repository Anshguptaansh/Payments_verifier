# Live Payment Dashboard

## Overview

Live Payment Dashboard is a full-stack payment simulation built to demonstrate how REST APIs, webhooks, HMAC verification, and WebSockets work together in a real application.

A customer starts a payment from the React frontend. The Node.js backend creates the payment and sends it to a simulated payment provider. After a short processing delay, the provider sends a signed webhook back to the backend. The backend verifies the signature, updates the payment record, and broadcasts the result to an admin dashboard over a persistent WebSocket connection.

The result is a live operational view where payment activity appears without refreshing the page.

## Key Features

- Customer payment page with amount, payment initiation, and clear status feedback.
- Simulated payment provider that produces successful or failed payment outcomes.
- REST API for creating payments and retrieving payment data.
- Webhook endpoint for receiving provider events such as `payment.processing`, `payment.captured`, and `payment.failed`.
- HMAC-SHA256 signature generation and verification using a shared webhook secret.
- SQLite-backed payment records for persistent local development data.
- WebSocket server that broadcasts payment events to connected admin clients.
- Admin dashboard with live payment ID, amount, status, event type, and timestamp updates.
- Separate frontend routes for the customer and admin experiences.
- Health-check endpoint for monitoring backend availability.

## Architecture

```text
Customer UI
    |
    | REST request
    v
Node.js / Express API ----> Fake Payment Provider
    ^                              |
    |                              | Signed webhook
    +------------------------------+
    |
    | Verify, persist, broadcast
    v
WebSocket Server ----> Admin Dashboard
```

## Payment Flow

1. The customer clicks **Pay**.
2. The frontend sends a REST request to the backend.
3. The backend creates a payment and forwards it to the fake provider.
4. The provider simulates processing and sends a signed webhook.
5. The backend verifies the HMAC signature before accepting the event.
6. The payment status is updated in SQLite.
7. The backend broadcasts the event through WebSocket.
8. The admin dashboard updates instantly without a page refresh.

## Technology Stack

- **Frontend:** React, React Router, JavaScript, CSS
- **Backend:** Node.js, Express.js
- **Real-time communication:** WebSocket via `ws`
- **Storage:** SQLite using Node.js's built-in SQLite support
- **Security concept demonstrated:** HMAC-SHA256 webhook verification

## What This Project Demonstrates

This project shows the difference between request-response communication and event-driven communication:

- **REST:** The frontend asks the backend to create a payment.
- **Webhook:** An external provider notifies the backend that payment processing has completed.
- **WebSocket:** The backend pushes the latest payment event to the admin browser.
- **HMAC:** The backend confirms that webhook payloads were signed with the expected shared secret.

It is intentionally a learning-focused simulation rather than a production payment system. No real money, payment gateway, authentication, or third-party payment SDK is involved.