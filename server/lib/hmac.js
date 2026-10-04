// ============================================================
// hmac.js — HMAC-SHA256 Signing & Verification
// ============================================================
// This module handles webhook security using HMAC (Hash-based
// Message Authentication Code) with SHA-256.
//
// HOW HMAC WORKS:
//   1. Both sides (Fake Payment Provider & Our Backend) share
//      a SECRET KEY (defined in config.js).
//   2. The SENDER (Fake Provider) takes the webhook JSON body,
//      runs it through HMAC-SHA256 with the secret, and sends
//      the resulting "signature" in a request header.
//   3. The RECEIVER (Our Backend) takes the same body, computes
//      HMAC-SHA256 with the same secret, and compares signatures.
//   4. If they match → the webhook is authentic.
//      If they don't → someone tampered with it or doesn't know the secret.
//
// WHY timingSafeEqual?
//   A simple === comparison leaks timing information. An attacker
//   could measure how long the comparison takes to figure out
//   the correct signature character by character. timingSafeEqual
//   always takes the same amount of time regardless of where
//   the mismatch is. This is a real-world security best practice.
//
// WHERE IT FITS:
//   Fake Payment Provider → generateSignature() → sends in header
//   Our Backend webhook endpoint → verifySignature() → trusts or rejects
// ============================================================

import crypto from 'crypto';

/**
 * Generate an HMAC-SHA256 signature for a given payload.
 *
 * @param {object|string} payload - The data to sign (will be JSON.stringified if object)
 * @param {string} secret - The shared webhook secret
 * @returns {string} - The hex-encoded HMAC signature
 */
export function generateSignature(payload, secret) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // crypto.createHmac creates an HMAC instance
  // .update() feeds data into it
  // .digest('hex') returns the final hash as a hexadecimal string
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Verify an HMAC-SHA256 signature against a payload.
 *
 * @param {object|string} payload - The received webhook body
 * @param {string} receivedSignature - The signature from the x-webhook-signature header
 * @param {string} secret - The shared webhook secret
 * @returns {boolean} - true if signature is valid, false otherwise
 */
export function verifySignature(payload, receivedSignature, secret) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Compute what the signature SHOULD be
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  // Convert both to Buffers for timingSafeEqual
  const expected = Buffer.from(expectedSignature, 'hex');
  const received = Buffer.from(receivedSignature, 'hex');

  // Length check first — timingSafeEqual requires same-length buffers
  if (expected.length !== received.length) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(expected, received);
}
