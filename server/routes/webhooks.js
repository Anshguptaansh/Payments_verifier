// ============================================================
// routes/webhooks.js — Webhook Receiver Endpoint
// ============================================================
// THIS IS THE MOST IMPORTANT FILE FOR UNDERSTANDING WEBHOOKS.
//
// A webhook is the OPPOSITE of a normal API call:
//   - Normal: YOUR frontend calls YOUR backend (you initiate)
//   - Webhook: EXTERNAL service calls YOUR backend (they initiate)
//
// Your server just sits here, listening. At some point, the Fake
// Payment Provider decides the payment is done and POSTs to this
// endpoint. You didn't ask for it — it just arrives.
//
// SECURITY:
//   Anyone could POST to /webhooks/payment and pretend to be the
//   payment provider. That's why we verify the HMAC signature.
//   Only someone who knows the shared secret can produce a valid
//   signature. If verification fails → reject with 401.
//
// FLOW:
//   Fake Payment Provider
//        │
//        │  POST /webhooks/payment
//        │  Header: x-webhook-signature: <hmac>
//        │  Body: { event, payload }
//        ▼
//   THIS FILE
//        │
//        │  1. Extract signature from header
//        │  2. Verify HMAC against body
//        │  3. If valid → update payment in SQLite
//        │  4. Broadcast update via WebSocket
//        │  5. Respond 200 OK
//        │
//        │  If invalid → respond 401 Unauthorized
// ============================================================

import { Router } from 'express';
import { verifySignature } from '../lib/hmac.js';
import { updatePayment } from '../lib/database.js';
import { broadcast } from '../lib/websocket.js';
import { config } from '../config.js';

const router = Router();

/**
 * POST /webhooks/payment
 *
 * Receives webhook events from the Fake Payment Provider.
 * Verifies the signature, updates the database, and broadcasts via WebSocket.
 */
router.post('/payment', (req, res) => {
  console.log('\n[Webhook] ════════════════════════════════════════');
  console.log('[Webhook] Incoming webhook received!');

  // Step 1: Extract the signature from the request header
  const receivedSignature = req.headers['x-webhook-signature'];

  if (!receivedSignature) {
    console.log('[Webhook] ✗ No signature found in headers. Rejecting.');
    return res.status(401).json({
      success: false,
      error: 'Missing webhook signature'
    });
  }

  // Step 2: Verify the HMAC signature
  // We need to use the RAW body string for verification, not the parsed object.
  // Why? Because JSON.stringify(parsedObject) might produce a different string
  // than what was originally sent (key ordering, whitespace, etc.).
  // For simplicity, we stringify the body — this works because our fake provider
  // also uses JSON.stringify to generate the signature.
  const isValid = verifySignature(req.body, receivedSignature, config.webhookSecret);

  if (!isValid) {
    console.log('[Webhook] ✗ SIGNATURE VERIFICATION FAILED!');
    console.log('[Webhook] This webhook is NOT trusted. Could be tampered or fake.');
    console.log('[Webhook] ════════════════════════════════════════\n');
    return res.status(401).json({
      success: false,
      error: 'Invalid webhook signature. Webhook rejected.'
    });
  }

  console.log('[Webhook] ✓ Signature verified successfully!');

  // Step 3: Extract event data from the webhook payload
  const { event, payload } = req.body;
  const { paymentId, amount, status, processedAt } = payload;

  console.log(`[Webhook] Event: ${event}`);
  console.log(`[Webhook] Payment: ${paymentId} | ₹${amount} | Status: ${status}`);

  // Step 4: Update the payment in SQLite
  const updatedPayment = updatePayment(paymentId, {
    status: status,
    eventType: event
  });

  console.log('[Webhook] ✓ Payment updated in database.');

  // Step 5: Broadcast the update via WebSocket to all connected admin dashboards
  broadcast({
    type: 'PAYMENT_UPDATE',
    payment: updatedPayment,
    event: event,
    timestamp: processedAt
  });

  console.log('[Webhook] ✓ WebSocket broadcast sent to admin dashboards.');
  console.log('[Webhook] ════════════════════════════════════════\n');

  // Step 6: Respond 200 OK to acknowledge receipt
  // Payment providers expect a 200 response. If they don't get one,
  // they'll retry the webhook (in real systems).
  res.status(200).json({
    success: true,
    message: `Webhook processed: ${event}`
  });
});

export default router;
