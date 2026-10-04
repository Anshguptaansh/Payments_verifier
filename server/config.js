export const config = {
  port: process.env.PORT || 3001,
  // Shared secret between the backend and the fake payment provider.
  // Set WEBHOOK_SECRET in your Railway environment variables.
  webhookSecret: process.env.WEBHOOK_SECRET || "super_secret_webhook_key_12345",
  // Public URL of this backend — used by the fake provider to send webhooks back.
  // Set BACKEND_URL to your Railway deployment URL in production.
  backendUrl: process.env.BACKEND_URL || "http://localhost:3001",
  // Delay in milliseconds to simulate payment processing before sending a webhook
  paymentProcessingDelay: 4000
};
