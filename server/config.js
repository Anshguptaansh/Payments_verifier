export const config = {
  port: process.env.PORT || 3001,
  // Shared secret between the backend and the fake payment provider.
  // Set WEBHOOK_SECRET in your Railway environment variables.
  webhookSecret: process.env.WEBHOOK_SECRET || "super_secret_webhook_key_12345",
  // Public URL of this backend — used by the fake provider to send webhooks back.
  // Render injects RENDER_EXTERNAL_URL automatically, so no manual setup needed.
  // For other platforms, set BACKEND_URL in your environment variables.
  backendUrl: process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_URL || "http://localhost:3001",
  // Delay in milliseconds to simulate payment processing before sending a webhook
  paymentProcessingDelay: 4000
};
