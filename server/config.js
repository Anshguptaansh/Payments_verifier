const insecureDefault = 'super_secret_webhook_key_12345';

// Warn at startup if the webhook secret is missing or using the insecure default.
// This makes HMAC verification security theater — anyone who reads the source
// code knows the secret and can forge webhook payloads.
if (!process.env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET === insecureDefault) {
  console.warn('');
  console.warn('⚠️  WARNING: WEBHOOK_SECRET is not set or is using the insecure default.');
  console.warn('   Set a strong random value in your environment variables before deploying.');
  console.warn('');
}

export const config = {
  port: process.env.PORT || 3001,

  // Shared secret between the backend and the fake payment provider.
  // Set WEBHOOK_SECRET in your Render environment variables.
  webhookSecret: process.env.WEBHOOK_SECRET || insecureDefault,

  // Public URL of this backend — used by the fake provider to send webhooks back.
  // Render injects RENDER_EXTERNAL_URL automatically, so no manual setup needed.
  // For other platforms, set BACKEND_URL in your environment variables.
  backendUrl: process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || 'http://localhost:3001',

  // Delay in milliseconds to simulate payment processing before sending a webhook.
  // Override with PAYMENT_PROCESSING_DELAY env var if needed.
  paymentProcessingDelay: parseInt(process.env.PAYMENT_PROCESSING_DELAY) || 4000,
};
