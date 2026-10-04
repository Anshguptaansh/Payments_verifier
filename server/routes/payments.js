// ============================================================
// routes/payments.js — REST API Endpoints
// ============================================================
// This file defines the REST API routes that the CUSTOMER FRONTEND
// will call. This is the traditional request/response pattern:
//   Frontend sends a request → Backend processes it → Backend sends a response
//
// ROUTES:
//   POST /api/payments  — Customer initiates a new payment
//   GET  /api/payments  — List all payments (for debugging / admin)
//   GET  /api/payments/:id — Get a specific payment by ID
//
// WHERE IT FITS:
//   Customer Frontend
//        │
//        │  POST /api/payments { amount, product }
//        ▼
//   THIS FILE (payments.js)
//        │
//        │  1. Creates payment in SQLite (status: "created")
//        │  2. Triggers Fake Payment Provider to process it
//        ▼
//   Returns payment ID to customer
// ============================================================

import { Router } from 'express';
import crypto from 'crypto';
import { createPayment, getAllPayments, getPaymentById } from '../lib/database.js';
import { processPayment } from '../lib/fakePaymentProvider.js';

const router = Router();

/**
 * POST /api/payments
 *
 * The customer frontend calls this when the user clicks "Pay".
 * It creates a payment record and kicks off the fake provider.
 *
 * Request body: { amount: number, product: string }
 * Response: { success: true, payment: { id, amount, product, status, ... } }
 */
router.post('/', (req, res) => {
  const { amount, product } = req.body;

  // Validate input
  if (!amount || !product) {
    return res.status(400).json({
      success: false,
      error: 'Both "amount" and "product" are required.'
    });
  }

  // Generate a unique payment ID (similar to how Razorpay generates pay_XXXXX)
  const paymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;

  // Store the payment in SQLite with status "created"
  const payment = createPayment({ id: paymentId, amount, product });

  console.log(`[REST API] Payment created: ${paymentId} | ₹${amount} | ${product}`);

  // Trigger the fake payment provider to process this payment.
  // This is ASYNCHRONOUS — the provider will take a few seconds,
  // then send a webhook back to our backend.
  // We do NOT wait for it to finish — the customer gets an immediate response.
  processPayment(paymentId, amount);

  // Respond immediately to the customer with the payment details
  res.status(201).json({
    success: true,
    message: 'Payment initiated. Awaiting processing...',
    payment
  });
});

/**
 * GET /api/payments
 *
 * Returns all payments. Useful for debugging and for the admin dashboard
 * to load initial state.
 */
router.get('/', (req, res) => {
  const payments = getAllPayments();
  res.json({ success: true, payments });
});

/**
 * GET /api/payments/:id
 *
 * Returns a single payment by ID. Useful for the customer frontend
 * to poll the status of their payment.
 */
router.get('/:id', (req, res) => {
  const payment = getPaymentById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      error: `Payment ${req.params.id} not found.`
    });
  }

  res.json({ success: true, payment });
});

export default router;
