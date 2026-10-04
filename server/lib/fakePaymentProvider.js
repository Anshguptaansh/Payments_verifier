// ============================================================
// fakePaymentProvider.js — Simulates a 3rd-Party Payment Gateway
// ============================================================
// In the real world, when you initiate a payment with Razorpay/Stripe:
//   1. You send them a payment request
//   2. They process it on THEIR servers (you have no control)
//   3. After processing, they send a WEBHOOK to YOUR server
//      to tell you whether it succeeded or failed
//
// This module simulates that exact behavior:
//   1. Receives a payment ID and amount
//   2. Waits 3-5 seconds (simulating bank processing)
//   3. Randomly decides success (70%) or failure (30%)
//   4. Constructs a webhook payload
//   5. Signs it with HMAC-SHA256 using the shared secret
//   6. POSTs it to our backend's webhook endpoint
//
// WHERE IT FITS:
//   REST API (payments.js) calls processPayment()
//        │
//        ▼
//   THIS MODULE (fakePaymentProvider.js)
//        │
//        │  waits... decides... signs...
//        │
//        │  POST /webhooks/payment
//        ▼
//   Our Backend's webhook endpoint (webhooks.js)
//
// IMPORTANT: This simulates an EXTERNAL service calling YOUR server.
// In production, this code would live on Razorpay's servers, not yours.
// ============================================================

import { config } from '../config.js';
import { generateSignature } from './hmac.js';

/**
 * Simulate processing a payment and sending a webhook.
 *
 * @param {string} paymentId - The payment ID to process
 * @param {number} amount - The payment amount
 */
export function processPayment(paymentId, amount) {
  // Use configurable delay (defaults to 4000ms), plus up to 2s of random jitter
  const delay = config.paymentProcessingDelay + Math.random() * 2000;

  console.log(`[Fake Provider] Processing payment ${paymentId}... (will take ${(delay / 1000).toFixed(1)}s)`);

  setTimeout(async () => {
    // Randomly decide success or failure (70% success, 30% failure)
    const isSuccess = Math.random() < 0.7;
    const eventType = isSuccess ? 'payment.captured' : 'payment.failed';
    const status = isSuccess ? 'captured' : 'failed';

    console.log(`[Fake Provider] Payment ${paymentId} → ${status.toUpperCase()}`);

    // Construct the webhook payload
    // This is what Razorpay/Stripe would send to your server
    const webhookPayload = {
      event: eventType,
      payload: {
        paymentId,
        amount,
        status,
        processedAt: new Date().toISOString()
      }
    };

    // Sign the payload using HMAC-SHA256 with the shared secret
    // The signature proves this webhook came from a trusted source
    const signature = generateSignature(webhookPayload, config.webhookSecret);

    console.log(`[Fake Provider] Sending webhook to ${config.backendUrl}/webhooks/payment`);
    console.log(`[Fake Provider] Signature: ${signature.substring(0, 16)}...`);

    try {
      // Send the webhook POST request to our backend
      // Note: In real life, Razorpay would send this to YOUR public URL
      const response = await fetch(`${config.backendUrl}/webhooks/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The signature goes in a custom header
          // Razorpay uses "x-razorpay-signature", Stripe uses "stripe-signature"
          // We use "x-webhook-signature"
          'x-webhook-signature': signature
        },
        body: JSON.stringify(webhookPayload)
      });

      const result = await response.json();
      console.log(`[Fake Provider] Webhook response: ${response.status}`, result);
    } catch (error) {
      console.error(`[Fake Provider] Failed to send webhook:`, error.message);
    }
  }, delay);
}
